import { Route, Routes } from "react-router-dom";
import NextStepApp from "./pages/NextStepApp";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<NextStepApp />} />
      <Route path="*" element={<NextStepApp />} />
    </Routes>
  );
};

export default App;
