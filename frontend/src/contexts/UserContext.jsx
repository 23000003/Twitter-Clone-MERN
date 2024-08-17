import { createContext, useEffect, useState } from "react";
import { useFetchUser } from "../controller/UserController";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  
  const [user, setUser] = useState({
    username: localStorage.getItem("username"),
    _id: localStorage.getItem("_id"),
    profile: localStorage.getItem("profile_pic"),
    posts: [],
  });

  const [userData, setUserData] = useState([]);

  useEffect(() =>{

    if(user.username){
      const FetchUserData = async() =>{
        try{
          const data = await useFetchUser();
          setUserData(data.data.data);
        }catch(err){
          console.log(err.message);
        }
      }
      FetchUserData();
    }

  },[user]);

  console.log(user);

  return (
    <UserContext.Provider value={{ user, setUser, userData }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
