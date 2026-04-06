import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 

export default function Editor({ token, username, onLogout }) {
  const [title, setTitle] = useState('Untitled Note');
  const [content, setContent] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState(null); 
  const [notes, setNotes] = useState([]); 
  
  const [localFolders, setLocalFolders] = useState([]); 
  const [activeFolder, setActiveFolder] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  const [referenceFile, setReferenceFile] = useState(null);
  const [showReference, setShowReference] = useState(false);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('https://bringesh-notes-api.onrender.com/api/notes', { headers: getAuthHeaders() });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) onLogout(); 
        return;
      }
      const data = await response.json();
      setNotes(data);
    } catch (error) { console.error("Error fetching notes:", error); }
  };

  const dbFolders = notes.map(n => n.semester).filter(Boolean);
  const allFolders = Array.from(new Set([...localFolders, ...dbFolders])).sort();

  useEffect(() => {
    if (allFolders.length > 0 && !allFolders.includes(activeFolder)) setActiveFolder(allFolders[0]);
  }, [allFolders, activeFolder]);

  const displayedNotes = notes.filter(n => n.semester === activeFolder);

  const handleCreateFolder = () => {
    const newFolder = prompt("Enter a name for your new folder:");
    if (newFolder && newFolder.trim() !== '') {
      const folderName = newFolder.trim();
      if (!allFolders.includes(folderName)) setLocalFolders(prev => [...prev, folderName]);
      setActiveFolder(folderName);
      startNewNote();
    }
  };

  const handleRenameFolder = async (oldName, e) => {
    e.stopPropagation();
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    const trimmedNewName = newName.trim();

    setLocalFolders(prev => prev.map(f => f === oldName ? trimmedNewName : f));
    const notesToUpdate = notes.filter(n => n.semester === oldName);
    
    if (notesToUpdate.length > 0) {
      setIsSaving(true);
      try {
        await Promise.all(notesToUpdate.map(note => 
          fetch(`https://bringesh-notes-api.onrender.com/api/notes/${note._id}`, {
            method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ ...note, semester: trimmedNewName })
          })
        ));
        await fetchNotes(); 
      } catch (error) { alert("Error renaming notes."); }
      setIsSaving(false);
    }
    if (activeFolder === oldName) setActiveFolder(trimmedNewName);
  };

  const handleDeleteFolder = async (folderName, e) => {
    e.stopPropagation();
    const notesToDelete = notes.filter(n => n.semester === folderName);
    const confirmMsg = notesToDelete.length > 0 
      ? `WARNING: This will delete "${folderName}" AND all ${notesToDelete.length} note(s) inside it! Sure?`
      : `Delete empty folder "${folderName}"?`;

    if (!window.confirm(confirmMsg)) return;

    if (notesToDelete.length > 0) {
      setIsSaving(true);
      try {
        await Promise.all(notesToDelete.map(note => 
          fetch(`https://bringesh-notes-api.onrender.com/api/notes/${note._id}`, { method: 'DELETE', headers: getAuthHeaders() })
        ));
        await fetchNotes();
      } catch (error) { alert("Error deleting notes."); }
      setIsSaving(false);
    }
    setLocalFolders(prev => prev.filter(f => f !== folderName));
  };

  // Instant local file loading
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setReferenceFile({ name: file.name, url: URL.createObjectURL(file) });
      setShowReference(true);
    } else if (file) {
      alert("Please upload a PDF file.");
    }
  };

  const handleSaveNote = async () => {
    if (!content) return alert("Cannot save an empty note!");
    if (!title.trim()) return alert("Please give your note a title!");
    
    setIsSaving(true);
    try {
      const url = currentNoteId ? `https://bringesh-notes-api.onrender.com/api/notes/${currentNoteId}` : 'https://bringesh-notes-api.onrender.com/api/notes';
      const method = currentNoteId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), 
        body: JSON.stringify({ title, content, semester: activeFolder }) 
      });
      
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to save note.");
        setIsSaving(false);
        return;
      }
      setCurrentNoteId(data._id); 
      fetchNotes();
    } catch (error) { alert("Could not connect to the database."); }
    setIsSaving(false);
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`https://bringesh-notes-api.onrender.com/api/notes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchNotes();
      if (currentNoteId === id) startNewNote();
    } catch (error) { alert("Failed to delete note."); }
  };

  const handleSummarize = async () => {
    if (!content) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('https://bringesh-notes-api.onrender.com/api/summarize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: content })
      });
      const data = await response.json();
      setContent(prev => prev + `<br><br><strong>✨ AI Summary:</strong><br>${data.summary}`);
    } catch (error) {}
    setIsSummarizing(false);
  };

  const handleGenerateQuiz = async () => {
    if (!content) return;
    setIsQuizzing(true);
    try {
      const response = await fetch('https://bringesh-notes-api.onrender.com/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: content })
      });
      const data = await response.json();
      setContent(prev => prev + `<br><br><hr><br><h2>🧠 Practice Quiz</h2>${data.quiz}`);
    } catch (error) {}
    setIsQuizzing(false);
  };

  const loadNote = (note) => { 
    setCurrentNoteId(note._id); 
    setTitle(note.title); 
    setContent(note.content); 
    // Clear out any old PDF when switching notes
    setReferenceFile(null);
    setShowReference(false);
  };
  
  const startNewNote = () => { 
    setCurrentNoteId(null); 
    setTitle('Untitled Note'); 
    setContent(''); 
    setReferenceFile(null); 
    setShowReference(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#0d1117] font-sans text-gray-200 overflow-hidden">
      
      <div className={`flex flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[448px] opacity-100' : 'w-0 opacity-0'}`}>
        <aside className="w-48 bg-[#161b22] border-r border-gray-800 flex flex-col z-20 flex-shrink-0">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center h-[61px]">
            <h1 className="font-bold text-sm tracking-widest text-gray-400 uppercase">Folders</h1>
            <button onClick={handleCreateFolder} className="text-gray-400 hover:text-white" title="New Folder">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {allFolders.map(folder => (
              <div key={folder} onClick={() => { setActiveFolder(folder); startNewNote(); }} className={`group cursor-pointer w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${ activeFolder === folder ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                <span className="truncate pr-2">📁 {folder}</span>
                <div className="hidden group-hover:flex gap-2">
                  <button onClick={(e) => handleRenameFolder(folder, e)} className="hover:text-blue-400">✏️</button>
                  <button onClick={(e) => handleDeleteFolder(folder, e)} className="hover:text-red-400">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <aside className="w-64 bg-[#0d1117] border-r border-gray-800 flex flex-col z-10 flex-shrink-0">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center h-[61px]">
            <h2 className="font-semibold text-gray-100 truncate pr-2">{activeFolder || 'No Folder'}</h2>
            {activeFolder && (
              <button onClick={startNewNote} className="text-gray-400 hover:text-blue-400" title="New Note">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {displayedNotes.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 mt-4">Empty folder.</div>
            ) : (
              displayedNotes.map(note => (
                <div key={note._id} onClick={() => loadNote(note)} className={`p-4 border-b border-gray-800/50 cursor-pointer transition-colors group flex flex-col gap-1 ${currentNoteId === note._id ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm font-semibold truncate ${currentNoteId === note._id ? 'text-blue-400' : 'text-gray-200'}`}>{note.title}</h3>
                    <button onClick={(e) => handleDeleteNote(note._id, e)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="flex-1 flex flex-col bg-[#0d1117] min-w-0">
        <header className="h-[61px] border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d1117]">
          
          <div className="flex items-center gap-3 w-1/3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-800 transition-colors" title="Toggle Sidebar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold bg-transparent border-none outline-none focus:ring-0 text-white w-full placeholder-gray-600" placeholder="Name your note..." />
          </div>
          
          <div className="flex gap-2 items-center">
            <button onClick={handleSaveNote} disabled={isSaving} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors border border-gray-700">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <div className="w-px h-6 bg-gray-700 mx-1"></div> 
            <button onClick={handleSummarize} disabled={isSummarizing} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors">✨ Summarize</button>
            <button onClick={handleGenerateQuiz} disabled={isQuizzing} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium transition-colors">🧠 Quiz</button>
            
            <div className="w-px h-6 bg-gray-700 mx-1"></div> 
            
            <label className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition-colors border border-gray-700 cursor-pointer flex items-center gap-2">
              <span>📁 {referenceFile ? 'Change PDF' : 'Upload PDF'}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
            
            {referenceFile && (
              <button onClick={() => setShowReference(!showReference)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition-colors border border-gray-700">
                {showReference ? 'Hide PDF' : 'Show PDF'}
              </button>
            )}

            <div className="w-px h-6 bg-gray-700 mx-1"></div>

            <div className="flex items-center gap-3 px-3 py-1 bg-[#161b22] border border-gray-800 rounded-lg ml-2">
              <span className="text-sm font-medium text-gray-300">👤 {username}</span>
              <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">Logout</button>
            </div>

          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {showReference && referenceFile && (
            <div className="w-1/2 border-r border-gray-800 bg-[#161b22] flex flex-col transition-all">
              <div className="px-4 py-2 bg-[#161b22] border-b border-gray-800 flex justify-between items-center text-xs font-semibold text-gray-400">
                <span className="truncate">{referenceFile.name}</span>
                <button onClick={() => setShowReference(false)} className="hover:text-white transition-colors" title="Close PDF">✕</button>
              </div>
              <iframe 
                src={referenceFile.url} 
                className="flex-1 w-full border-none bg-white" 
                title="PDF Viewer" 
              />
            </div>
          )}
          <div className="flex-1 bg-white flex flex-col relative overflow-hidden transition-all">
            <ReactQuill theme="snow" value={content} onChange={setContent} className="h-full text-black pb-10" placeholder="Start typing your formatted notes here..." />
          </div>
        </main>
      </div>
    </div>
  );
}