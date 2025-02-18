"use client"
import React from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { XIcon } from 'lucide-react';

interface ImageUploadProps {
    onChange:(url:string) => void;
    value:string;
    endpoint: "imageUploader";
}
const ImageUpload = ({value, endpoint, onChange}:ImageUploadProps) => {
    if(value){
        return(
            <div className='relative size-40'>
                <img src={value} alt="upload"
                className='rounded-md size-40 object-cover' />
                <button type='button'
                onClick={()=> onChange("")}
                 className='absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm'>
                    <XIcon className='h-4 w-4 text-white'/>
                </button>
            </div>
        )
    }
  return (
    <UploadDropzone endpoint={endpoint}
    onClientUploadComplete={(res:any)=>{
        onChange(res?.[0].ufsUrl)
    }} 
    onUploadError={(err:Error)=>{
        console.error(err)
    }}/>
  )
}

export default ImageUpload
