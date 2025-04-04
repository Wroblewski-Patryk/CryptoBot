export default function ProgressBar({percent}) {
    return (
        <div className="w-full bg-emerald-100 rounded-full h-2.5 dark:bg-emerald-900 mt-2 mb-2">
            <div
            className="bg-emerald-500 h-2.5 rounded-full"
            style={{ width: `${percent}%` }}
            >
            </div>
        </div>
    );
}