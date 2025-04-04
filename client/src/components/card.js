export default function Card({ title, children, footer }){
    return (
        <div className="card p-4 mb-2 bg-cyan-900 rounded border border-gray-500 outline-cyan-500">
          {title && (
            <div className="card-title text-white font-bold mb-2">
              {title}
            </div>
          )}
          <div className="card-body text-white mb-2">
            {children}
          </div>
          {footer && (
            <div className="card-footer text-gray-300 text-sm">
              {footer}
            </div>
          )}
        </div>
      );
} 