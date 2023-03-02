import './App.css'
import io from 'socket.io-client'
import uploader from 'socket.io-file-client'
import {useState, useEffect} from 'react'

const socket = io('http://localhost:4000')

function App() {

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const [user, setUser] = useState([])

  const [login, setLogin] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    socket.emit('message', message)
    setMessage('')
  }

  const handleUser = (e) => {
    e.preventDefault()
    socket.emit('user', user, (data) => {
      if (data) {
        console.log(data, 'Usuario aceptado')
        setLogin(true)
        setUser(user)
      } else {
        console.log(data, 'Ya hay un usuario con ese nombre')
      }
    })
    setUser('')
  }

  useEffect(() => {
    const receiveMessage = (message) => {

      setMessages([...messages, {
        body: message.body,
        from: message.from
      }])
    }

    socket.on('message', receiveMessage)

    return () => {
      socket.off('message', receiveMessage)
    }
  },[messages])


  const [selectedFile, setSelectedFile] = useState(null);
  const [images, setImages] = useState([]);

  const handleFileInputChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const fileReader = new FileReader();
    fileReader.readAsDataURL(selectedFile);
    fileReader.onload = () => {
      socket.emit("upload-file", {
        filename: selectedFile.name,
        data: fileReader.result,
      });
    };
  };

  socket.on('image-data', (data, user) => {
    const imageData = URL.createObjectURL(new Blob([data]));
    const imageObject = { id: images.length + 1, data: imageData, user: user.username };
    setImages([...images, imageObject]);
  });

  return (
    <div className='App'>

      { login ? 
      <>
        <h1>Chat</h1>
        <h3>{user}</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type='text' 
            onChange={e=> setMessage(e.target.value)}
            value={message}
          />          
          <button>Enviar</button>
        </form>

        {messages.map( (msg,index) => <h5 key={index}>{msg.from.username}: {msg.body}</h5>)}

        <form onSubmit={handleFormSubmit}>
          <input type="file" onChange={handleFileInputChange} />
          <button type="submit">Upload</button>
        </form>

        <div>
          {images.map((image) => (
            <div key={image.id}>
              <p>Imagen enviada por: {image.user}</p>
              <img src={image.data} style={{width:'100px'}} />
            </div>
          ))}
        </div>

      </> 
      : 
      <>
        <h1>Registrate</h1>
        <form onSubmit={handleUser}>
          <input 
            type='text'
            onChange={e=> setUser(e.target.value)}
            value={user}
            placeholder='Ingresa tu nombre'
          />
          <button>Registrarme</button>
        </form>
      </>
      }

    </div>
  )
}

export default App
