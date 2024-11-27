import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data);
    } else {
      console.error('Error fetching messages:', error.message);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || username.trim() === '') return;

    const { error } = await supabase.from('messages').insert([
      { content: newMessage, user: username },
    ]);

    if (!error) {
      setNewMessage('');
      // Actualización manual en caso de que el tiempo real no funcione
      fetchMessages();
    } else {
      console.error('Error sending message:', error.message);
    }
  };

  const confirmUsername = () => {
    if (tempUsername.trim() !== '') {
      setUsername(tempUsername);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Realtime Chat</h1>
      {!username && (
        <div>
          <input
            type="text"
            placeholder="Enter your username"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
          />
          <button onClick={confirmUsername}>Set Username</button>
        </div>
      )}
      {username && (
        <div>
          <div
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              maxHeight: '300px',
              Height: '50vh',
              overflowY: 'auto',
            }}
          >
            {messages.map((message) => (
              <div key={message.id}>
                <strong>{message.user}</strong>: {message.content}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Type your message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
