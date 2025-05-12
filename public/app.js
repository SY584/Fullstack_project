
document.addEventListener('DOMContentLoaded', function () {
  const apiBase = 'http://localhost:3000/api';
  let token = localStorage.getItem('token');


  const authSection = document.getElementById('authSection');
  const authForm = document.getElementById('authForm');
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const loginButton = document.getElementById('loginButton');
  const registerButton = document.getElementById('registerButton');
  const authMessage = document.getElementById('authMessage');
  const noteTitle = document.getElementById('noteTitle');
  const noteContent = document.getElementById('noteContent');
  const addNoteButton = document.getElementById('addNote');
  const notesContainer = document.getElementById('notesContainer');
  const themeToggleButton = document.getElementById('themeToggle');
  const createNoteButton = document.getElementById('createNote');
  const noteInputSection = document.querySelector('.note-input');
  const searchInput = document.getElementById('search');
  const quoteElement = document.getElementById('quote');
  const modal = document.getElementById('editNoteModal');
  const closeModal = document.querySelector('.close-modal');
  const saveEditButton = document.getElementById('saveEditNote');
  const cancelEditButton = document.getElementById('cancelEditNote');
  const editTitleInput = document.getElementById('editNoteTitle');
  const editContentInput = document.getElementById('editNoteContent');

  let notes = [];
  let darkMode = localStorage.getItem('darkMode') === 'true';
  let currentEditingNoteId = null;

  function updateAuthVisibility() {
    if (token) {
      authSection.style.display = 'none';
      noteInputSection.style.display = 'block';

      document.querySelector('.sidebar-actions').style.display = 'flex';

      document.querySelector('.main-header').style.display = 'block';
      notesContainer.style.display = 'grid';
    } else {
      authSection.style.display = 'block';
      noteInputSection.style.display = 'none';

      document.querySelector('.sidebar-actions').style.display = 'none';

      document.querySelector('.main-header').style.display = 'none';
      notesContainer.style.display = 'none';
    }
  }

  function showToast(message, type = 'success') {
    const config = {
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      className: `toast-${type}`,
      style: {
        background: type === 'success'
          ? "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)"
          : type === 'error'
            ? "linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)"
            : "linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
      }
    };

    if (type === 'loading') {
      config.duration = -1;
    }

    return Toastify(config).showToast();
  }

  function showAuthMessage(message, isError = false) {
    showToast(message, isError ? 'error' : 'success');
  }

  function escapeHTML(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }


  registerButton.addEventListener('click', async function () {
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!username || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Registration successful! Please login.');
        passwordEl.value = '';
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    }
  });


  loginButton.addEventListener('click', async function () {
    const username = usernameEl.value.trim();
    const password = passwordEl.value.trim();

    if (!username || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const loadingToast = showToast('Logging in...', 'loading');

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      loadingToast.hideToast();

      if (res.ok) {
        token = data.token;
        localStorage.setItem('token', token);
        showToast('Welcome back! Login successful');
        updateAuthVisibility();
        fetchNotes();
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      loadingToast.hideToast();
      showToast('Network error. Please try again.', 'error');
    }
  });

  function logout() {
    token = null;
    localStorage.removeItem('token');
    notes = [];
    displayNotes();
    updateAuthVisibility();
    showToast('Logged out successfully');
  }


  document.getElementById('logoutButton').onclick = logout;

  async function fetchNotes() {
    try {
      const res = await fetch(`${apiBase}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notes');
      notes = await res.json();
      displayNotes();
    } catch (error) {
      showToast('Failed to fetch notes', 'error');
    }
  }

  async function addNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();


    try {
      const response = await fetch(`${apiBase}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });


      if (!response.ok) {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      loadingToast.hideToast();
      showToast('Failed to create note', 'error');
    }
  }

  window.deleteNote = async function (noteId) {
    if (!noteId) return;

    const loadingToast = showToast('Deleting note...', 'loading');

    try {
      const response = await fetch(`${apiBase}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      loadingToast.hideToast();

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      notes = notes.filter(note => note._id !== noteId);
      displayNotes();
      showToast('🗑️ Note deleted successfully');
    } catch (error) {
      loadingToast.hideToast();
      showToast('Failed to delete note', 'error');
    }
  };

  function showModal() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    currentEditingNoteId = null;
    editTitleInput.value = '';
    editContentInput.value = '';
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  closeModal.addEventListener('click', hideModal);
  cancelEditButton.addEventListener('click', hideModal);

  function displayNotes(filtered = notes) {
    notesContainer.innerHTML = filtered.map(note => `
      <div class="note" data-note-id="${note._id}">
        <h3>${escapeHTML(note.title)}</h3>
        <p>${escapeHTML(note.content)}</p>
        <div class="note-actions">
          <button onclick="editNote('${note._id}')" class="update">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <button onclick="deleteNote('${note._id}')" class="delete">
            <i class="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  window.editNote = function (noteId) {
    const note = notes.find(n => n._id === noteId);
    if (note) {
      currentEditingNoteId = noteId;
      editTitleInput.value = note.title;
      editContentInput.value = note.content;
      showModal();
    }
  };

  saveEditButton.addEventListener('click', async () => {
    if (!currentEditingNoteId) return;

    const title = editTitleInput.value.trim();
    const content = editContentInput.value.trim();

    if (!title || !content) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const loadingToast = showToast('Updating your note...', 'loading');

    try {
      const response = await fetch(`${apiBase}/notes/${currentEditingNoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      loadingToast.hideToast();

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      hideModal();
      await fetchNotes();
      showToast('✍️ Note updated successfully! Your changes are saved.');
    } catch (error) {
      loadingToast.hideToast();
      showToast('Failed to update note', 'error');
    }
  });

  async function fetchQuote() {
    try {
      const response = await fetch('https://api.quotable.io/quotes/random?maxLength=100');
      if (!response.ok) throw new Error('Primary API failed');
      const data = await response.json();
      quoteElement.textContent = `"${data[0].content}" - ${data[0].author}`;
    } catch (error) {
      try {
        const response = await fetch('https://type.fit/api/quotes');
        if (!response.ok) throw new Error('Secondary API failed');
        const quotes = await response.json();
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteElement.textContent = `"${randomQuote.text}" - ${randomQuote.author || 'Unknown'}`;
      } catch (fallbackError) {
        const defaultQuotes = [
          '"The best way to predict the future is to invent it." - Alan Kay',
          '"Stay hungry, stay foolish." - Steve Jobs',
          '"The only way to do great work is to love what you do." - Steve Jobs',
          '"Innovation distinguishes between a leader and a follower." - Steve Jobs',
          '"Your time is limited, so don\'t waste it living someone else\'s life." - Steve Jobs'
        ];
        quoteElement.textContent = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
      }
    }
  }

  createNoteButton.addEventListener('click', () => {
    noteInputSection.style.display = noteInputSection.style.display === 'block' ? 'none' : 'block';
  });

  addNoteButton.onclick = addNote;

  themeToggleButton.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.toggleAttribute('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
    themeToggleButton.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const filtered = notes.filter(n => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term));
    displayNotes(filtered);
  });

  if (darkMode) {
    document.body.setAttribute('dark-mode', '');
    themeToggleButton.textContent = '☀️ Light Mode';
  }

  noteInputSection.style.display = 'none';
  fetchQuote();
  if (token) fetchNotes();


  updateAuthVisibility();
  fetchQuote();
  if (token) fetchNotes();

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      noteId: params.get('noteId')
    };
  }

  async function initializeNoteForm() {
    const { noteId } = getUrlParams();
    const noteInput = document.querySelector('.note-input');
    const addNoteButton = document.getElementById('addNote');

    if (noteId) {
      try {
        const response = await fetch(`${apiBase}/notes/${noteId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }

        const note = await response.json();

        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;

        addNoteButton.innerHTML = '<i class="fas fa-save"></i>Update Note';

        noteInput.style.display = 'block';

        addNoteButton.onclick = async () => {
          const title = document.getElementById('noteTitle').value;
          const content = document.getElementById('noteContent').value;

          if (!title || !content) {
            alert('Please fill in all fields');
            return;
          }

          try {
            const response = await fetch(`${apiBase}/notes/${noteId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
              throw new Error('Failed to update note');
            }

            window.location.href = '/';
          } catch (error) {
            console.error('Error updating note:', error);
            alert('Failed to update note');
          }
        };
      } catch (error) {
        console.error('Error fetching note:', error);
        alert('Failed to fetch note details');
        window.location.href = '/';
      }
    } else {
      addNoteButton.innerHTML = '<i class="fas fa-paper-plane"></i>Save Note';

      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';

      addNoteButton.onclick = async () => {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;

        if (!title || !content) {
          alert('Please fill in all fields');
          return;
        }

        try {
          const response = await fetch(`${apiBase}/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content })
          });

          if (!response.ok) {
            throw new Error('Failed to create note');
          }

          document.getElementById('noteTitle').value = '';
          document.getElementById('noteContent').value = '';

          fetchNotes();
        } catch (error) {
          console.error('Error creating note:', error);
          alert('Failed to create note');
        }
      };
    }
  }

  initializeNoteForm();
});
