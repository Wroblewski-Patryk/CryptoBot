export default function PageTitle({title}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <hr/>
        </div>
      </div>
    </div>
  );
}
