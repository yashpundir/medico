import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import VisitList from './components/VisitList';
import VisitDetail from './components/VisitDetail';
import AddVisit from './components/AddVisit';
import AddCondition from './components/AddCondition';
import MedicationList from './components/MedicationList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<VisitList />} />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="add-visit" element={<AddVisit />} />
          <Route path="add-condition" element={<AddCondition />} />
          <Route path="medications" element={<MedicationList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;