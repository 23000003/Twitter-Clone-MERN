import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Post from "../models/Post.js";


const createToken = (_id: string) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "10d" });
};

const RegisterUser = async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const exist = await User.findOne({ username });
  if (exist) {
    return res.status(400).json({ error: "Username is already taken" });
  }

  const salt = await bcrypt.genSalt();
  const hashed = await bcrypt.hash(password, salt);
  const registered_at = new Date();
  const profile_pic = 'https://res.cloudinary.com/domvrvasq/image/upload/default_czji94.jpg';
  const bio = ' ';
  const background_pic = ' ';

  try {
    const user = await User.create({ 
      username, 
      password: hashed, 
      registered_at,
      profile_pic,
      bio,
      background_pic,
    });

    const token = createToken(user._id.toString())

    res.status(200).json({ username, token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const LoginUser = async (req, res) => {
    
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
  
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Incorrect email." });
    }
  
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Incorrect password." });
    }
  
    try {
      const token = createToken(user._id.toString())
      res.status(200).json({ user, token });

    } catch (error) {

      res.status(500).json({ error: error.message });

    }

};

const FetchWhoToFollow = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allUsers = await User.find();

    const notFollowedbyUser = allUsers.filter(
      (u) => u._id.toString() !== user._id.toString() && !user.following.includes(u._id.toString())
    );

    return res.status(200).json(notFollowedbyUser);
  } catch (error) {
    
    console.error('Error fetching users to follow:', error);
    return res.status(500).json({ message: err.message });
  }
};

const FetchUser = async(req, res) =>{

  try{

    const { id } = req.params;

    const data = await User.findById(id)
    .populate({
      path: 'following',
      select: 'username profile_pic bio'
    })
    .populate({
      path: 'followers',
      select: 'username profile_pic bio'
    })
    .populate({
      path: 'bookmarks',
      populate: {
        path: 'author',
        select: 'username profile_pic bio'
      }
    })

    if(!data){
      return res.status(404).json({message: "User does not exist"})
    }

    return res.status(200).json({data})

  }catch(err){
    return res.status(500).json({message: err.message})
  }

}

const FollowAUser = async(req, res) =>{

  const { _id } = req.body;

  try{

    const FollowedUser = await User.findById(_id);

    if(!FollowedUser){
      return res.status(404).json({message: "User does not exist"});
    }

    const UpdateFollowing = await User.findById(req.user._id);

    UpdateFollowing.following.push(_id);

    await UpdateFollowing.save();

    return res.status(200).json({data: _id});

  }catch(err){
    return res.status(500).json({error: err.message});
  }

}

const UnFollowAUser = async(req, res) =>{

  const { id } = req.params;

  try{

    const user = await User.findById(req.user._id); //ur account

    if (!user.following.includes(id)) {
      return res.status(404).json({ message: "Follower not found" });
    }

    user.following = user.following.filter(userid => userid.toString() !== id);

    await user.save();

    return res.status(200).json({data: id});

  }catch(err){
    return res.status(500).json({error: err.message});
  }

}

const AddToUserBookmarks = async (req, res) =>{
  
  const { _id } = req.body;

  try{

    const user = await User.findById(req.user._id);

    if(!user){
      return res.status(404).json({message: "User not Found"});
    }

    user.bookmarks.push(_id);

    await user.save();

    const sendUser = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        populate: {
          path: 'author',
          select: 'username profile_pic bio'
        }
      });

    return res.status(200).json({data: sendUser, message: "Added to bookmarks"})

  }catch(err){
    return res.status(500).json({error: err.message});
  }

}

const RemoveFromUserBookmarks = async (req, res) =>{

  const { id } = req.params;

  try{

    const user = await User.findById(req.user._id); //ur account

    if(!user){
      return res.status(404).json({message: "User not Found"});
    }

    user.bookmarks = user.bookmarks.filter(bookmarkid => bookmarkid.toString() !== id);

    await user.save();

    const sendUser = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        populate: {
          path: 'author',
          select: 'username profile_pic bio'
        }
      });

    return res.status(200).json({data: sendUser, message: "Removed from bookmarks"});

  }catch(err){

    return res.status(500).json({error: err.message});
  
  }

}

export {
  LoginUser, RegisterUser, FetchWhoToFollow, 
  FetchUser, FollowAUser, UnFollowAUser,
  AddToUserBookmarks, RemoveFromUserBookmarks
}