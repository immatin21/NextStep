const Header = () => {
  return (
    <header className="border-b border-gray-300 bg-gray-200/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-green-900/90 text-white flex items-center justify-center font-bold text-lg">
            N
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-800/90 leading-tight">
              NextStep
            </h1>
          </div>
        </div>
        <p className="text-base sm:text-lg font-semibold text-gray-700">
          Personal Decision Assistant
        </p>
      </div>
    </header>
  );
};

export default Header;
