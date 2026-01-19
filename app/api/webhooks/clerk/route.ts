import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not found", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (!id) {
    return new Response("No user ID found", { status: 400 });
  }

  try {
    if (eventType === "user.created") {
      const { email_addresses, first_name, last_name } = evt.data;
      const profile_image_url = (evt.data as any).profile_image_url;
      const primaryEmail =
        email_addresses.find((email) => email.id === evt.data.primary_email_address_id)?.email_address ||
        email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("No email address found", { status: 400 });
      }

      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
          profileImage: profile_image_url ?? null,
        },
      });

      console.log(`User created in database: ${id}`);
    }

    if (eventType === "user.updated") {
      const { email_addresses, first_name, last_name } = evt.data;
      const profile_image_url = (evt.data as any).profile_image_url;
      const primaryEmail =
        email_addresses.find((email) => email.id === evt.data.primary_email_address_id)?.email_address ||
        email_addresses[0]?.email_address;

      if (primaryEmail) {
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail,
            firstName: first_name ?? null,
            lastName: last_name ?? null,
            profileImage: profile_image_url ?? null,
          },
        });

        console.log(`User updated in database: ${id}`);
      }
    }

    if (eventType === "user.deleted") {
      await prisma.user.delete({
        where: { clerkId: id },
      });

      console.log(`User deleted from database: ${id}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}
