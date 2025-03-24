/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";

import { useSupabase as Supabase } from "@/lib/supabase/supabase-server";
import { User } from "@/lib/system/user/user";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const supabase = await Supabase();
  const SIGNING_SECRET = process.env.CLERK_SIGNING_KEY;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env",
    );
  }

  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  const eventType = evt.type;
  console.log(`Received event: ${eventType}`);

  try {
    if (eventType === "user.created") {
      await handleUserCreated(evt.data, supabase);
    } else if (eventType === "user.updated") {
      await handleUserUpdated(evt.data, supabase);
    } else if (eventType === "user.deleted") {
      await handleUserDeleted(evt.data, supabase);
    } else {
      console.warn(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling event ${eventType}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response("Webhook received", { status: 200 });
}

async function handleUserCreated(data: any, supabase: any) {
  try {
    const { id, email_addresses, first_name, last_name, image_url, username } =
      data;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", id)
      .maybeSingle();

    if (error) throw error;
    if (existingUser) return;

    const newUser = new User({
      clerk_id: id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      username,
    }).toJSON();

    const { error: insertError } = await supabase.from("users").insert(newUser);

    if (insertError) {
      console.error("Error inserting user:", insertError);
    } else {
      console.log("User inserted successfully:", id);
    }

    console.log("User created:", id);
  } catch (error) {
    console.error("Error in handleUserCreated:", error);
  }
}

async function handleUserUpdated(data: any, supabase: any) {
  try {
    const { id, email_addresses, first_name, last_name, image_url, username } =
      data;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!existingUser) {
      console.error("Error: User does not exist");
      return;
    }

    await supabase
      .from("users")
      .update({
        email_addresses,
        first_name,
        last_name,
        image_url,
        username,
        updated_at: Date.now(),
      })
      .eq("clerk_id", id);

    console.log("User updated:", id);
  } catch (error) {
    console.error("Error in handleUserUpdated:", error);
  }
}

async function handleUserDeleted(data: any, supabase: any) {
  try {
    const { id } = data;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!existingUser) {
      console.error("Error: User does not exist");
      return;
    }

    await supabase
      .from("users")
      .update({
        is_deleted: true,
        deleted_at: Date.now(),
        updated_at: Date.now(),
      })
      .eq("clerk_id", id);

    console.log("User deleted:", id);
  } catch (error) {
    console.error("Error in handleUserDeleted:", error);
  }
}
