import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import VisitList from './components/VisitList';
import VisitDetail from './components/VisitDetail';
import AddVisit from './components/AddVisit';
import Conditions from './components/Conditions';
import AddStandaloneDocument from './components/AddStandaloneDocument';
import MedicationList from './components/MedicationList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<VisitList />} />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="add-visit" element={<AddVisit />} />
          <Route path="conditions" element={<Conditions />} />
          <Route path="standalone-upload" element={<AddStandaloneDocument />} />
          <Route path="medications" element={<MedicationList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;