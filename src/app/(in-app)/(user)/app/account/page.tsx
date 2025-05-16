
import { EditUserForm } from "@/components/forms/edit-user-form"
import { DeleteAccountSection } from "@/components/delete-account-section"
import { Separator } from "@/components/ui/separator"

export default function AccountPage() {
  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information.
          </p>
        </div>
        <EditUserForm />
      </div>

      <Separator />

      <DeleteAccountSection />
    </div>
  )
}