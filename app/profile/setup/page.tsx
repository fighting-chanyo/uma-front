import { Suspense } from "react";
import { ProfileSetupForm } from "./_components/profile-setup-form";

const ProfileSetupPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileSetupForm />
      </Suspense>
    </div>
  );
};

export default ProfileSetupPage;
