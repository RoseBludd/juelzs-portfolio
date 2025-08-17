import { useState, useEffect } from "react";

import { ApplicantDetail } from "../types";

interface MeetingNotesProps {
  applicant: ApplicantDetail;
  onSave: (data: {
    notes: string;
    interestLevel: "interested" | "not_interested" | "undecided";
    lastMeetingDate: string;
    nextMeetingDate: string;
  }) => Promise<void>;
  saving: boolean;
}

export default function MeetingNotes({
  applicant,
  onSave,
  saving,
}: MeetingNotesProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(applicant.meetingNotes || "");
  const [interestLevel, setInterestLevel] = useState<
    "interested" | "not_interested" | "undecided"
  >(applicant.interestLevel || "undecided");
  
  // For datetime-local inputs, we need to format dates as YYYY-MM-DDThh:mm
  const [lastMeetingDate, setLastMeetingDate] = useState(
    applicant.lastMeetingDate 
      ? formatDateForInput(new Date(applicant.lastMeetingDate))
      : ""
  );
  const [nextMeetingDate, setNextMeetingDate] = useState(
    applicant.nextMeetingDate
      ? formatDateForInput(new Date(applicant.nextMeetingDate))
      : ""
  );

  // Update state when applicant changes
  useEffect(() => {
    setNotes(applicant.meetingNotes || "");
    setInterestLevel(applicant.interestLevel || "undecided");
    setLastMeetingDate(
      applicant.lastMeetingDate 
        ? formatDateForInput(new Date(applicant.lastMeetingDate))
        : ""
    );
    setNextMeetingDate(
      applicant.nextMeetingDate
        ? formatDateForInput(new Date(applicant.nextMeetingDate))
        : ""
    );
  }, [applicant]);

  // Format date for datetime-local input
  function formatDateForInput(date: Date): string {
    // Format as YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  }

  // Convert input date format to ISO string for API
  function formatDateForAPI(inputDate: string): string {
    if (!inputDate) return "";
    try {
      // Create a date object and convert to ISO string
      const date = new Date(inputDate);
      return date.toISOString();
    } catch (error) {
      console.error("Invalid date format:", error);
      return "";
    }
  }

  const handleSaveNotes = async () => {
    await onSave({
      notes,
      interestLevel,
      lastMeetingDate: lastMeetingDate ? formatDateForAPI(lastMeetingDate) : "",
      nextMeetingDate: nextMeetingDate ? formatDateForAPI(nextMeetingDate) : "",
    });
    setEditingNotes(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Meeting Notes</h2>
        <button
          onClick={() => setEditingNotes(!editingNotes)}
          className="text-indigo-400 hover:text-indigo-300"
        >
          {editingNotes ? "Cancel" : "Edit"}
        </button>
      </div>

      {editingNotes ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Interest Level
            </label>
            <select
              value={interestLevel}
              onChange={(e) => setInterestLevel(e.target.value as any)}
              className="w-full rounded-lg bg-gray-700 border-gray-600 text-white"
            >
              <option value="undecided">Undecided</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Last Meeting Date
            </label>
            <input
              type="datetime-local"
              value={lastMeetingDate}
              onChange={(e) => setLastMeetingDate(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Next Meeting Date
            </label>
            <input
              type="datetime-local"
              value={nextMeetingDate}
              onChange={(e) => setNextMeetingDate(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-gray-700 border-gray-600 text-white"
              placeholder="Enter meeting notes..."
            />
          </div>

          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-400">
              Interest Level:
            </span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-sm ${
                applicant.interestLevel === "interested"
                  ? "bg-green-900 text-green-200"
                  : applicant.interestLevel === "not_interested"
                  ? "bg-red-900 text-red-200"
                  : "bg-gray-900 text-gray-200"
              }`}
            >
              {applicant.interestLevel
                ? applicant.interestLevel.replace("_", " ")
                : "Undecided"}
            </span>
          </div>

          {applicant.lastMeetingDate && (
            <div>
              <span className="text-sm font-medium text-gray-400">
                Last Meeting:
              </span>
              <span className="ml-2 text-white">
                {new Date(applicant.lastMeetingDate).toLocaleString()}
              </span>
            </div>
          )}

          {applicant.nextMeetingDate && (
            <div>
              <span className="text-sm font-medium text-gray-400">
                Next Meeting:
              </span>
              <span className="ml-2 text-white">
                {new Date(applicant.nextMeetingDate).toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <span className="block text-sm font-medium text-gray-400 mb-2">
              Notes:
            </span>
            <p className="text-white whitespace-pre-wrap">
              {applicant.meetingNotes || "No meeting notes yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 