import { CreateOrganizationForm } from "@/components/forms/create-organization-form";

export default function CreateOrganizationPage() {
  return (
    <div className="container max-w-lg py-10 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Create Organization</h1>
        <p className="text-muted-foreground mt-2">
          Create a new organization to collaborate with your team.
        </p>
      </div>
      <CreateOrganizationForm />
    </div>
  );
}
