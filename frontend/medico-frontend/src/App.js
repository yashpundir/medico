import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Layout from './components/Layout';
import VisitList from './components/VisitList';
import VisitDetail from './components/VisitDetail';
import AddVisit from './components/AddVisit';
import Conditions from './components/Conditions';
import AddStandaloneDocument from './components/AddStandaloneDocument';
import MedicationList from './components/MedicationList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<VisitList />} />
            <Route path="visits/:id" element={<VisitDetail />} />
            <Route path="add-visit" element={<AddVisit />} />
            <Route path="conditions" element={<Conditions />} />
            <Route path="standalone-upload" element={<AddStandaloneDocument />} />
            <Route path="medications" element={<MedicationList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;