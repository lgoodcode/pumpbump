import { RegisterUserForm, registerUserFormSchema } from "@/lib/schemas/user";
import { createServer } from "@/lib/supabase/server";
import { api } from "@/app/api/axios";

export const dynamic = "force-dynamic";
export const POST = async (req: Request) => {
  try {
    const data = await req.json() as RegisterUserForm;
    if (!data) {
      return Response.json({
        error: "Missing data",
        isSupabaseError: false,
      }, { status: 400 });
    }

    const { error: parseError } = registerUserFormSchema.safeParse(data);
    if (parseError) {
      console.error(parseError.message);
      return Response.json({
        error: "Invalid data",
        isSupabaseError: false,
      }, {
        status: 400,
      });
    }

    const supabase = createServer();
    const { error: authError, data: { user } } = await supabase.auth.signUp({
      // Set the username as email to allow users to not provide an email
      email: data.username + "@fakemail.com",
      password: data.password,
      options: {
        data: {
          username: data.username,
          email: data.email,
        },
      },
    });
    if (authError || !user) {
      const error = authError || new Error("Failed to create user");
      console.error(error);
      return Response.json({
        error: error.message,
        isSupabaseError: true,
      }, {
        status: 500,
      });
    }

    // Send the request to generate the wallet - error logging is done on that server
    const response = await api.get(`/wallet/generate/${user.id}`);
    if (response.status !== 201) {
      console.error(response.data);
      return Response.json({
        error: "An unexpected error occurred",
        isSupabaseError: false,
      }, {
        status: 500,
      });
    }

    return Response.json({ message: "User created successfully" }, {
      status: 201,
    });
  } catch (error: any) {
    console.error(error.message);
    return Response.json({
      error: "An unexpected error occurred",
      isSupabaseError: false,
    }, {
      status: 500,
    });
  }
};
