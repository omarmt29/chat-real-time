import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesContainerRef = useRef(null);

  // Al cargar, configurar canales en tiempo real
  useEffect(() => {
    fetchMessages();
    fetchTypingUsers();

    const messagesChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel('realtime-typing')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status' },
        () => {
          fetchTypingUsers(); // Actualizar usuarios escribiendo en tiempo real
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, []);

  // Obtener mensajes
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (!error) {
      setMessages(data.reverse());
      setTimeout(() => scrollToBottom(), 100);
    } else {
      console.error('Error fetching messages:', error.message);
    }
  };

  // Obtener usuarios escribiendo
  const fetchTypingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('typing_status')
        .select('*')
        .eq('is_typing', true);

      if (error) throw error;

      setTypingUsers(
        data.map((user) => user.username).filter((u) => u !== username)
      );
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching typing users:', error.message);
    }
  };

  // Confirmar nuevo usuario y registrar en `typing_status`
  const confirmUsername = async () => {
    if (tempUsername.trim() !== '') {
      try {
        // Registrar o actualizar al usuario en `typing_status`
        await supabase.from('typing_status').upsert({
          username: tempUsername,
          is_typing: false, // Inicialmente no está escribiendo
        });

        setUsername(tempUsername);
        setTimeout(() => scrollToBottom(), 800);
      } catch (error) {
        console.error('Error confirming username:', error.message);
      }
    }
  };

  // Actualizar estado de escribiendo
  const setTypingStatus = async (isTyping) => {
    try {
      await supabase
        .from('typing_status')
        .update({ is_typing: isTyping, updated_at: new Date().toISOString() })
        .eq('username', username); // Actualizar solo el registro del usuario actual
    } catch (error) {
      console.error('Error updating typing status:', error.message);
    }
  };

  // Manejar entrada de texto
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() !== '') {
      setTypingStatus(true);

      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        if (value.trim() === '') {
          setTypingStatus(false);
        }
      }, 1000);
    } else {
      setTypingStatus(false);
      clearTimeout(window.typingTimeout);
    }
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || username.trim() === '') return;

    try {
      const newMsg = {
        content: newMessage,
        user: username,
        created_at: new Date().toISOString(),
      };

      await supabase.from('messages').insert([newMsg]);
      setNewMessage('');
      setTypingStatus(false); // Dejar de escribir después de enviar
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  // Desplazar al final del contenedor de mensajes
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Formatear fecha de los mensajes
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen-dvh bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md h-screen-dvh bg-white shadow-xl rounded-lg flex flex-col">
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
                  {message.user}
                </div>
                <div className="chat-bubble flex flex-col text-lg gap-2">
                  {message.content}
                  <span className="text-xs">{formatDate(message.created_at)}</span>
                </div>
              </div>
            ))}

            {/* Mostrar usuarios escribiendo como burbujas */}
            {typingUsers.map((user, index) => (
              <div
                key={`typing-${index}`}
                className="chat chat-start flex flex-col gap-2"
              >
                <div className="chat-header text-lg font-bold">{user}</div>
                <div className="chat-bubble  italic text-xl">
                   <span className='text-xl'>...</span>
                </div>
              </div>
            ))}
          </div>

            <div className="p-4 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type your message"
                value={newMessage}
                onChange={handleTyping}
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
