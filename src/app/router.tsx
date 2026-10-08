import { BrowserRouter, Route, Routes } from 'react-router';
import { MemoEditorPage } from '@/pages/MemoEditorPage';
import { MemoListPage } from '@/pages/MemoListPage';
import { TrashPage } from '@/pages/TrashPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppRouter() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<MemoListPage />} />
        <Route path="/memos/:id" element={<MemoEditorPage />} />
        <Route path="/trash" element={<TrashPage />} />
      </Routes>
    </BrowserRouter>
  );
}
