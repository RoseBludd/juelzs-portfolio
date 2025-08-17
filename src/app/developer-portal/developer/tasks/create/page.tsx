"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeveloperCreateTaskModal } from "@/components/tasks/DeveloperCreateTaskModal";

export default function DeveloperCreateTaskPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handleTaskCreated = () => {
    // Redirect to developer dashboard after task is created
    router.push("/developer/dashboard");
  };

  const handleClose = () => {
    // Navigate back to developer dashboard
    router.push("/developer/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Show the modal immediately when the page loads */}
      {showModal && (
        <DeveloperCreateTaskModal
          onClose={handleClose}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
} 