
import { getProfileByUsername, getUserLikedPosts, getUserPosts, isFollowing } from '@/actions/profile.action';
import { notFound } from 'next/navigation'
import React, { FC, JSX } from 'react'
import ProfilePageClient from './ProfilePageClient';
interface PageProps {
   params: Promise<{ username: string }>;
 }

 export  async function generateMetadata ({params}:PageProps) {
    const {username} = await params;
    //if(!username) return;

    const user = await getProfileByUsername(username);
    if(!user) return ;


    return {
        title: `${user.name ?? user.username}`,
        description: user.bio || `Check out ${user.username}'s profile.`,
    }
}

const ProfilePageServer:FC<PageProps> = async({params})  => {
      const {username}  = await params;
     const user = await getProfileByUsername(username);
     if(!user) notFound();
     
     const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id),
     ]);
    
  return <ProfilePageClient 
  user={user}
  posts={posts}
  likedPosts = {likedPosts}
  isFollowing = {isCurrentUserFollowing}/>
}

export default ProfilePageServer;
