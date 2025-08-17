interface TaskDescriptionProps {
  description: string;
}

export const TaskDescription = ({ description }: TaskDescriptionProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 whitespace-pre-line leading-relaxed">{description}</p>
      </div>
    </div>
  );
}; 