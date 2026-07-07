import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <div className="flex justify-center items-start min-h-screen py-8 px-4 bg-background">
      <UserProfile
        path="/profile"
        routing="path"
      />
    </div>
  )
}
