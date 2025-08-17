"use client";

import { IconCircleCheck, IconArrowRight, IconX, IconGitPullRequest, IconLoader, IconExternalLink, IconEdit, IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import MeetingNotes from "./components/MeetingNotes";
import type { ApplicantDetail } from "./types";

export default function ApplicantDetail() {
  const params = useParams();
  const router = useRouter();
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string>("pending");
  const [saving, setSaving] = useState(false);
  const prLinkInputRef = useRef<HTMLInputElement>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [role, setRole] = useState<string>("");
  const roleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params && params.id) {
      // Ensure we're using a string ID
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      fetchApplicantDetail(id);
    }
  }, [params?.id]); // Only include the ID itself, not the entire params object

  useEffect(() => {
    if (applicant) {
      setApplicationStatus(applicant.status || "pending");
      setRole(applicant.role || "");
    }
  }, [applicant]);

  async function fetchApplicantDetail(id: string) {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching applicant detail for ID: ${id}`);
      
      // Use the new query parameter API endpoint
      const endpoint = `/api/admin/applicants/detail?id=${id}`;
      
      console.log(`Fetching from: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch applicant details: ${response.status}`, errorText);
        throw new Error(`Failed to fetch applicant details: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.error('Invalid API response:', result);
        throw new Error('Invalid response format or missing data');
      }
      
      console.log('Received applicant data:', result.data);
      
      // Set the applicant data
      setApplicant(result.data);
    } catch (error) {
      console.error("Error fetching applicant:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotes(noteData: {
    notes: string;
    interestLevel: "interested" | "not_interested" | "undecided";
    lastMeetingDate: string;
    nextMeetingDate: string;
  }) {
    setSaving(true);
    try {
      // Ensure we're using a string ID
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Create request body with required fields
      const requestBody: any = {
        meetingNotes: noteData.notes,
        interestLevel: noteData.interestLevel,
        status: applicationStatus,
      };
      
      // Only include valid date strings
      if (noteData.lastMeetingDate) {
        requestBody.lastMeetingDate = noteData.lastMeetingDate;
      }
      
      if (noteData.nextMeetingDate) {
        requestBody.nextMeetingDate = noteData.nextMeetingDate;
      }
      
      // Use the new query parameter API endpoint
      const endpoint = `/api/admin/applicants/detail?id=${id}`;
      
      console.log(`Saving to: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error:`, errorData);
        throw new Error("Failed to save notes");
      }

      await fetchApplicantDetail(id);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setSaving(false);
    }
  }
  
  // Modified to handle status change directly from dropdown
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setApplicationStatus(newStatus);
    
    // Save immediately
    setSaving(true);
    try {
      // Ensure we're using a string ID
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Use the new query parameter API endpoint
      const endpoint = `/api/admin/applicants/detail?id=${id}`;
      
      console.log(`Updating status on: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error:`, errorData);
        throw new Error("Failed to update status");
      }

      await fetchApplicantDetail(id);
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert to previous status on error
      if (applicant) {
        setApplicationStatus(applicant.status || "pending");
      }
    } finally {
      setSaving(false);
    }
  };

  async function handleSavePrLink() {
    setSaving(true);
    try {
      // Ensure we're using a string ID
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Get the input value from ref
      const prLinkValue = prLinkInputRef.current?.value || '';
      
      // Use the new query parameter API endpoint
      const endpoint = `/api/admin/applicants/detail?id=${id}`;
      
      // Create an object with initial data if no github_submission exists
      const submissionData = applicant?.github_submission 
        ? { ...applicant.github_submission, pr_link: prLinkValue }
        : { 
            pr_link: prLinkValue, 
            status: "pending",
            submitted_at: new Date().toISOString()
          };
      
      console.log(`Saving PR link to: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          github_submission: submissionData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error:`, errorData);
        throw new Error("Failed to save PR link");
      }

      await fetchApplicantDetail(id);
    } catch (error) {
      console.error("Failed to save PR link:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRole() {
    setSaving(true);
    setEditingRole(false);
    try {
      // Ensure we're using a string ID
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Get the input value from ref (fallback to current role if empty)
      const roleValue = roleInputRef.current?.value || role;
      
      // Use the new query parameter API endpoint
      const endpoint = `/api/admin/applicants/detail?id=${id}`;
      
      console.log(`Updating role to: ${roleValue}`);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: roleValue
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error:`, errorData);
        throw new Error("Failed to update role");
      }
      
      // Update state
      setRole(roleValue);
      
      // Refresh the applicant details
      await fetchApplicantDetail(id);
    } catch (error) {
      console.error("Failed to update role:", error);
      // If there was an error, reset to editing state
      setEditingRole(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900 text-red-200 p-4 rounded-lg">
          {error || "Applicant not found"}
        </div>
        <Link
          href="/admin/applicants"
          className="inline-flex items-center text-indigo-400 hover:text-indigo-300"
        >
          <span className="mr-2">←</span>
          Back to Applicants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Improved Layout */}
      <div className="bg-gray-800 rounded-lg p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Back Button and Applicant Info */}
          <div className="space-y-3">
            <Link
              href="/admin/applicants"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span className="mr-2">←</span>
              Back to Applicants
            </Link>
            <h1 className="text-3xl font-bold text-white">{applicant.name || "Unnamed Applicant"}</h1>
            <div className="flex flex-col xs:flex-row xs:items-center space-y-1 xs:space-y-0 xs:space-x-3 text-gray-400">
              <span>{applicant.email || "No email"}</span>
              {role || editingRole ? (
                <>
                  <span className="hidden xs:block text-gray-600">•</span>
                  <div className="flex items-center rounded-md bg-gray-700/70 px-2 py-0.5 text-xs text-gray-300">
                    {editingRole ? (
                      <>
                        <input
                          ref={roleInputRef}
                          type="text"
                          defaultValue={role}
                          className="bg-transparent border-none focus:outline-none text-white w-24"
                          placeholder="Enter role"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRole();
                            }
                          }}
                        />
                        <button
                          onClick={handleSaveRole}
                          disabled={saving}
                          className="ml-1 p-0.5 text-indigo-400 hover:text-indigo-300"
                          title="Save role"
                        >
                          {saving ? <IconLoader size={12} className="animate-spin" /> : <IconCheck size={12} />}
                        </button>
                      </>
                    ) : (
                      <>
                        {role}
                        <button
                          onClick={() => setEditingRole(true)}
                          className="ml-1 p-0.5 text-gray-400 hover:text-gray-300"
                          title="Edit role"
                        >
                          <IconEdit size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setEditingRole(true)}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 text-xs flex items-center"
                >
                  <IconEdit size={12} className="mr-1" />
                  Add role
                </button>
              )}
              {applicant.whatsappNumber && (
                <>
                  <span className="hidden xs:block text-gray-600">•</span>
                  <span>WhatsApp: {applicant.whatsappNumber}</span>
                </>
              )}
            </div>
          </div>

          {/* Status, Score and Actions */}
          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            {/* Application Status with Styled Dropdown */}
            <div className="w-full sm:w-auto">
              <label htmlFor="applicationStatus" className="text-sm text-gray-400 mb-1 block">
                Application Status
              </label>
              <div className="relative">
                <select
                  id="applicationStatus"
                  value={applicationStatus}
                  onChange={handleStatusChange}
                  disabled={saving}
                  className="w-full sm:w-44 px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-8 disabled:opacity-70"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="rejected">Rejected</option>
                </select>
                {saving && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <IconLoader size={16} className="animate-spin text-indigo-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Score and Assessment Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end mt-2">
              {(applicant.github_submission?.grade_result?.finalScore !== undefined || applicant.score !== null) && (
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-md px-4 py-2 text-white shadow-sm">
                  <div className="text-xs text-gray-400 mb-1">Score</div>
                  <div className="font-semibold text-lg">
                    {applicant.github_submission?.grade_result?.finalScore !== undefined 
                      ? `${applicant.github_submission.grade_result.finalScore}%` 
                      : applicant.score !== null 
                        ? `${applicant.score}%`
                        : "N/A"}
                  </div>
                </div>
              )}
              
              {/* Only show assessment button if there's a GitHub submission */}
              {applicant.github_submission && (
                <Link 
                  href={`/admin/assessment/grade?id=${applicant.id}&assessmentId=${applicant.github_submission.assessmentId || "unknown"}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                  {applicant.github_submission.grade_result ? "View Assessment" : "Grade Assessment"}
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Application Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-700">
          {/* Application Date */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Applied</span>
            <span className="text-sm text-white">
              {applicant.applicationDate ? new Date(applicant.applicationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'Unknown'}
            </span>
          </div>
          
          {/* GitHub Submission Date */}
          {applicant.github_submission?.submitted_at && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">GitHub Submission</span>
              <span className="text-sm text-white">
                {new Date(applicant.github_submission.submitted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {/* WhatsApp Number */}
          {applicant.whatsappNumber && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">WhatsApp</span>
              <span className="text-sm text-white">
                +{applicant.whatsappNumber}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main grid content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Additional Information */}
        <div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Additional Information
            </h2>
            
            {/* Display assessment information if available */}
            {applicant.github_submission ? (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  GitHub Submission
                </h3>
                {applicant.github_submission.url && (
                  <div className="mb-2">
                    <span className="text-gray-400">PR:</span>{" "}
                    <a 
                      href={applicant.github_submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 inline-flex items-center"
                    >
                      #{applicant.github_submission.pr_number} <IconExternalLink size={14} className="ml-1" />
                    </a>
                  </div>
                )}
                
                {/* Add PR link edit field */}
                <div className="mt-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="pr_link" className="text-gray-400 text-sm">Edit PR link:</label>
                    {saving && <IconLoader size={14} className="animate-spin text-indigo-300" />}
                  </div>
                  <div className="flex items-center">
                    <input
                      id="pr_link"
                      type="text"
                      placeholder="https://github.com/..."
                      ref={prLinkInputRef}
                      defaultValue={applicant.github_submission.pr_link || applicant.github_submission.url || ''}
                      className="bg-gray-700 border border-gray-600 text-white rounded-l-md py-1 px-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                    />
                    <button
                      onClick={() => handleSavePrLink()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-sm rounded-r-md transition-colors"
                      disabled={saving}
                    >
                      Save
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <div>
                    <span className="text-gray-400">Status:</span>{" "}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      applicant.github_submission.status === "completed" ? "bg-green-900 text-green-200" : 
                      applicant.github_submission.status === "failed" ? "bg-red-900 text-red-200" : 
                      "bg-blue-900 text-blue-200"
                    }`}>
                      {applicant.github_submission.status || "pending"}
                    </span>
                  </div>
                  {applicant.github_submission.tasks_done !== undefined && (
                    <div>
                      <span className="text-gray-400">Tasks Completed:</span>{" "}
                      <span className="text-white">{applicant.github_submission.tasks_done} of {applicant.github_submission.total_tasks || "?"}</span>
                    </div>
                  )}
                </div>
                
                {/* Display assessment score if available */}
                {applicant.github_submission.grade_result && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Assessment Score:</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold text-white">{applicant.github_submission.grade_result.finalScore}%</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        applicant.github_submission.grade_result.finalScore >= 70 ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
                      }`}>
                        {applicant.github_submission.grade_result.finalScore >= 70 ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-1">
                      {applicant.github_submission.grade_result.recommendedAction}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  GitHub Submission
                </h3>
                <p className="text-gray-400 mb-3">No GitHub submission data yet.</p>
                
                {/* Add PR link field even if no submission yet */}
                <div className="mt-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="pr_link" className="text-gray-400 text-sm">Add PR link:</label>
                    {saving && <IconLoader size={14} className="animate-spin text-indigo-300" />}
                  </div>
                  <div className="flex items-center">
                    <input
                      id="pr_link"
                      type="text"
                      placeholder="https://github.com/..."
                      ref={prLinkInputRef}
                      className="bg-gray-700 border border-gray-600 text-white rounded-l-md py-1 px-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                    />
                    <button
                      onClick={() => handleSavePrLink()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-sm rounded-r-md transition-colors"
                      disabled={saving}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Portfolio URL if available */}
            {applicant.portfolioUrl && (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  Portfolio
                </h3>
                <a 
                  href={applicant.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 inline-flex items-center"
                >
                  {applicant.portfolioUrl} <IconExternalLink size={14} className="ml-1" />
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column: Meeting Notes */}
        <div>
          <MeetingNotes
            applicant={applicant}
            onSave={handleSaveNotes}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
