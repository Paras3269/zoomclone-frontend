import React ,{useEffect,useCallback,useRef}from 'react'
import { useSocket } from '../context/SocketProvider'
import { useState } from 'react';
import ReactPlayer from 'react-player';

import peer from '../service/peer';
const RoomPage = () =>{
    const myVideoRef = useRef(null);
    const myVideoRef2 = useRef(null);

    const socket = useSocket();
    const [remoteSocketId,setRemoteSocketId] = useState(null);
    const [myStream,setMyStream] = useState();
    const [remoteStream,setRemoteStream] = useState();

const handleUserJoined = useCallback(({email,id})=>{
  console.log(`Email${email} joined room`);
  setRemoteSocketId(id);
},[])

const handleCallUser = useCallback(async()=>{
     const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});

 const offer = await peer.getOffer();
 socket.emit("user:call",{to:remoteSocketId,offer});
     setMyStream(stream);
  
},[remoteSocketId,socket])


const handleIncommigCall = useCallback(async({from,offer})=>{
    setRemoteSocketId(from);
     const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
setMyStream(stream);
    console.log(`Incoming Call`,from,offer)
   const ans = await peer.getAnswer(offer);
socket.emit('call:accepted',{
    to:from,ans
})

},[socket])

const sendStreams = useCallback(() =>{
    for(const track of myStream.getTracks()){
        peer.peer.addTrack(track,myStream)
     }
},[myStream])

const hanldeCallAccepted = useCallback(({from,ans})=>{
     peer.setLocalDescription(ans);
     console.log(`Call Accepted`);
    sendStreams();
},[sendStreams]);

const handleNegoNeeded = useCallback(async()=>{
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed',{offer,to:remoteSocketId})
    
},[remoteSocketId, socket])

useEffect(()=>{
    peer.peer.addEventListener('negotiationneeded',handleNegoNeeded )
    return()=>{
         peer.peer.removeEventListener('negotiationneeded',handleNegoNeeded )
    }
},[handleNegoNeeded])

useEffect(()=>{
 peer.peer.addEventListener("track",async (ev)=>{
    const remoteStream = ev.streams
    console.log("got tracks")
    setRemoteStream(remoteStream[0])
 });

},[])

const handleNegoNeedIncoming = useCallback(async({from,offer})=>{
   const ans = await peer.getAnswer(offer);
   socket.emit('peer:nego:done',{to:from,ans})
},[socket])

const handleNegoNeedFinal = useCallback(async({ans})=>{
   await peer.setLocalDescription(ans);
},[])


    useEffect(()=>{
    socket.on("user:joined",handleUserJoined)
    socket.on("incomming:call",handleIncommigCall)
    socket.on('call:accepted',hanldeCallAccepted)
    socket.on('peer:nego:needed',handleNegoNeedIncoming)
    socket.on('peer:nego:final',handleNegoNeedFinal)
    
    return ()=>{
        socket.off('user:joined',handleUserJoined)
        socket.off("incomming:call",handleIncommigCall)
        socket.off('call:accepted',hanldeCallAccepted)
        socket.off('peer:nego:needed',handleNegoNeedIncoming)
        socket.off('peer:nego:final',handleNegoNeedFinal)
    }
    },[socket,handleUserJoined,handleIncommigCall,hanldeCallAccepted,handleNegoNeedIncoming,handleNegoNeedFinal])

      useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);
      useEffect(() => {
    if (myVideoRef2.current && remoteStream) {
      myVideoRef2.current.srcObject = remoteStream;
    }
  }, [remoteStream]) ;

    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected':'No one in room'}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {
                remoteSocketId && <button onClick={handleCallUser}>CALL</button>
            }

            <br/>

          
            
            
           {myStream && ( 
               <>

               <h1>My Stream</h1>
            <video
          ref={myVideoRef}
          autoPlay
          muted
          playsInline
          height="100px"
          width="200px"
        /></>)}
           {remoteStream && ( 
               <>

               <h1>Remote Stream</h1>
            <video
          ref={myVideoRef2}
          autoPlay
          muted
          playsInline
          height="100px"
          width="200px"
        /></>)}
           
          
            
        </div>
    )
}
export default RoomPage