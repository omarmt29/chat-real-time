import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const messagesContainerRef = useRef(null); // Referencia al contenedor de mensajes

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
          setTimeout(() => scrollToBottom(), 100); // Desplazar al final después de un breve retraso
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
      setTimeout(() => scrollToBottom(), 100); // Desplazar al final tras cargar mensajes
    } else {
      console.error('Error fetching messages:', error.message);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || username.trim() === '') return;

    // Crear el mensaje y enviarlo a Supabase
    const newMsg = {
      content: newMessage,
      user: username,
      created_at: new Date().toISOString(), // Marca de tiempo local
    };

    const { error } = await supabase.from('messages').insert([newMsg]);

    if (!error) {
      setNewMessage(''); // Limpiar el campo de entrada
    } else {
      console.error('Error sending message:', error.message);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const confirmUsername = () => {
    if (tempUsername.trim() !== '') {
      setUsername(tempUsername);
      setTimeout(() => scrollToBottom(), 800); // Desplazar al final tras establecer usuario
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md h-screen bg-white shadow-xl rounded-lg flex flex-col">
        {!username && (
          <div className="p-4 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Enter your username</h2>
            <input
              type="text"
              placeholder="Username"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <button onClick={confirmUsername} className="btn btn-primary">
              Start Chatting
            </button>
          </div>
        )}
        {username && (
          <>
            {/* Contenedor de mensajes */}
            <div
              ref={messagesContainerRef}
              className="flex-grow p-4 overflow-y-auto bg-[#e8e8e8]"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat pb-4 ${
                    message.user === username ? 'chat-end' : 'chat-start'
                  }`}
                >
                  <div className="chat-header mb-1 text-lg font-bold">
                    {message.user}{' '}
                   
                  </div>
                  <div className="chat-bubble flex flex-col text-lg gap-2">
                    {message.content} 

                    <span className="text-xs ">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Barra de entrada */}
            <div className="p-4 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="input input-bordered flex-grow"
              />
              <button onClick={handleSendMessage} className="btn btn-primary">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
