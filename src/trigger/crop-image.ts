import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import https from "https";

const execAsync = promisify(exec);

// Input schema for the crop image task
const CropImageInputSchema = z.object({
  imageUrl: z.string().url(),
  x: z.number().min(0).max(100), // X position as percentage
  y: z.number().min(0).max(100), // Y position as percentage
  width: z.number().min(1).max(100), // Width as percentage
  height: z.number().min(1).max(100), // Height as percentage
  transloaditKey: z.string(),
});

// Output schema
const CropImageOutputSchema = z.object({
  success: z.boolean(),
  croppedImageUrl: z.string().url().optional(),
  error: z.string().optional(),
});

export type CropImageInput = z.infer<typeof CropImageInputSchema>;
export type CropImageOutput = z.infer<typeof CropImageOutputSchema>;

/**
 * Get FFmpeg and FFprobe binary paths from environment or fallback to system binaries
 * Trigger.dev sets FFMPEG_PATH and FFPROBE_PATH when using the FFmpeg build extension
 */
function getBinaryPaths() {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const ffprobePath = process.env.FFPROBE_PATH || "ffprobe";
  
  console.log("[Binary Paths] FFmpeg:", ffmpegPath);
  console.log("[Binary Paths] FFprobe:", ffprobePath);
  
  return { ffmpegPath, ffprobePath };
}

/**
 * Crop Image Task
 * 
 * This task uses FFmpeg to crop an image based on percentage coordinates.
 * It downloads the image, crops it using FFmpeg, then uploads the result to Transloadit.
 * 
 * Prerequisites:
 * - FFmpeg must be installed in the Trigger.dev environment (configured via trigger.config.ts)
 * - FFMPEG_PATH and FFPROBE_PATH environment variables are used if available
 * - Falls back to system PATH if environment variables are not set
 * 
 * Process:
 * 1. Download image from URL to temp file
 * 2. Use FFprobe to get original image dimensions
 * 3. Convert percentage-based crop parameters to pixel values
 * 4. Execute FFmpeg crop operation
 * 5. Upload cropped image to Transloadit CDN
 * 6. Return CDN URL of cropped image
 */
export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 300, // 5 minutes
  run: async (payload: CropImageInput): Promise<CropImageOutput> => {
    const { ffmpegPath, ffprobePath } = getBinaryPaths();
    const tempDir = os.tmpdir();
    const inputFilePath = path.join(tempDir, `input-${Date.now()}.jpg`);
    const outputFilePath = path.join(tempDir, `output-${Date.now()}.jpg`);

    try {
      console.log("=== Starting Image Crop Task ===");
      console.log("[Config] Image URL:", payload.imageUrl);
      console.log("[Config] Crop parameters:", { 
        x: `${payload.x}%`, 
        y: `${payload.y}%`, 
        width: `${payload.width}%`, 
        height: `${payload.height}%` 
      });

      // Step 1: Download the image
      console.log("[1/6] Downloading image...");
      const response = await fetch(payload.imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(inputFilePath, buffer);
      const inputStats = await fs.stat(inputFilePath);
      console.log(`✓ Image downloaded: ${(inputStats.size / 1024).toFixed(2)} KB`);
      console.log(`✓ Temp file: ${inputFilePath}`);

      // Step 2: Get image dimensions using FFprobe
      console.log("[2/6] Analyzing image dimensions with FFprobe...");
      const probeCommand = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputFilePath}"`;
      
      let dimensions: string;
      try {
        const { stdout } = await execAsync(probeCommand);
        dimensions = stdout;
      } catch (error) {
        console.error("[ERROR] FFprobe execution failed:", error);
        throw new Error(`FFprobe failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      
      const [originalWidth, originalHeight] = dimensions.trim().split("x").map(Number);
      
      if (!originalWidth || !originalHeight || isNaN(originalWidth) || isNaN(originalHeight)) {
        throw new Error(`Invalid image dimensions received: ${dimensions}`);
      }
      
      console.log(`✓ Original dimensions: ${originalWidth}x${originalHeight}px`);

      // Step 3: Calculate crop dimensions from percentages
      console.log("[3/6] Calculating pixel crop values...");
      const cropWidth = Math.floor((originalWidth * payload.width) / 100);
      const cropHeight = Math.floor((originalHeight * payload.height) / 100);
      const cropX = Math.floor((originalWidth * payload.x) / 100);
      const cropY = Math.floor((originalHeight * payload.y) / 100);

      // Validate crop dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(`Invalid crop dimensions: width=${cropWidth}, height=${cropHeight}`);
      }
      
      if (cropX + cropWidth > originalWidth || cropY + cropHeight > originalHeight) {
        throw new Error(
          `Crop region exceeds image boundaries: ` +
          `crop(${cropX},${cropY},${cropWidth},${cropHeight}) > image(${originalWidth},${originalHeight})`
        );
      }

      console.log(`✓ Crop dimensions: x=${cropX}px, y=${cropY}px, ${cropWidth}x${cropHeight}px`);

      // Step 4: Crop the image using FFmpeg
      console.log("[4/6] Cropping image with FFmpeg...");
      const cropCommand = `"${ffmpegPath}" -i "${inputFilePath}" -vf "crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}" -q:v 2 -y "${outputFilePath}"`;
      
      try {
        const { stderr } = await execAsync(cropCommand);
        // FFmpeg outputs progress to stderr even on success
        if (stderr && stderr.includes("error")) {
          console.warn("[WARN] FFmpeg stderr:", stderr.substring(0, 500));
        }
      } catch (error) {
        console.error("[ERROR] FFmpeg execution failed:", error);
        throw new Error(`FFmpeg failed to crop image: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      
      // Verify output file exists and has content
      const outputStats = await fs.stat(outputFilePath);
      if (outputStats.size === 0) {
        throw new Error("Cropped image file is empty");
      }
      console.log(`✓ Image cropped successfully: ${(outputStats.size / 1024).toFixed(2)} KB`);
      console.log(`✓ Output file: ${outputFilePath}`);

      // Step 5: Upload cropped image to Transloadit
      console.log("[5/6] Uploading cropped image to Transloadit...");
      const FormData = (await import("form-data")).default;
      const formData = new FormData();
      
      const params = {
        auth: { key: payload.transloaditKey },
        steps: {
          ":original": {
            robot: "/upload/handle",
          },
        },
      };

      formData.append("params", JSON.stringify(params));
      
      // Read file and append to form
      const fileBuffer = await fs.readFile(outputFilePath);
      formData.append("file", fileBuffer, {
        filename: `cropped-${Date.now()}.jpg`,
        contentType: "image/jpeg",
      });

      // Use form-data's submit method instead of fetch
      const uploadResult = await new Promise<any>((resolve, reject) => {
        formData.submit("https://api2.transloadit.com/assemblies", (err, res) => {
          if (err) {
            reject(err);
            return;
          }

          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
          });

          res.on("end", () => {
            try {
              const result = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`Transloadit upload failed: ${res.statusCode} - ${data}`));
              } else {
                resolve(result);
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse Transloadit response: ${data}`));
            }
          });

          res.on("error", (error) => {
            reject(error);
          });
        });
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.message || uploadResult.error || "Upload failed");
      }
      
      console.log(`✓ Upload initiated, Assembly ID: ${uploadResult.assembly_id}`);

      // Step 6: Poll for assembly completion
      console.log("[6/6] Waiting for Transloadit assembly to complete...");
      let assemblyStatus = uploadResult;
      let attempts = 0;
      const maxAttempts = 30;

      while (
        assemblyStatus.ok !== "ASSEMBLY_COMPLETED" &&
        assemblyStatus.ok !== "REQUEST_ABORTED" &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const statusResponse = await fetch(assemblyStatus.assembly_url);
        
        if (!statusResponse.ok) {
          console.warn(`[WARN] Assembly status check failed: ${statusResponse.status}`);
          continue;
        }
        
        assemblyStatus = await statusResponse.json() as any;

        if (assemblyStatus.error) {
          throw new Error(assemblyStatus.message || "Upload processing failed");
        }

        if (assemblyStatus.ok === "ASSEMBLY_COMPLETED") {
          console.log(`✓ Assembly completed after ${attempts} seconds`);
          break;
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("Transloadit assembly timed out after 30 seconds");
      }

      // Step 7: Get the uploaded image URL
      const originalResults = assemblyStatus.uploads;
      if (originalResults && originalResults.length > 0) {
        const uploadedFile = originalResults[0];
        const cdnUrl = uploadedFile.ssl_url || uploadedFile.url;

        console.log("✓ Cropped image uploaded successfully");
        console.log("[Result] CDN URL:", cdnUrl);
        console.log("=== Crop Task Completed Successfully ===");

        return {
          success: true,
          croppedImageUrl: cdnUrl,
        };
      } else {
        throw new Error("No URL returned from Transloadit");
      }
    } catch (error) {
      console.error("=== Crop Task Failed ===");
      console.error("[ERROR]", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Cleanup temporary files
      console.log("[Cleanup] Removing temporary files...");
      try {
        await fs.unlink(inputFilePath).catch(() => {});
        await fs.unlink(outputFilePath).catch(() => {});
        console.log("✓ Cleanup completed");
      } catch (cleanupError) {
        console.warn("[WARN] Error during cleanup:", cleanupError);
      }
    }
  },
});
