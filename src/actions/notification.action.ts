"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { tree } from "next/dist/build/templates/app-page";

const getNotifications = async () => {
  try {
    const userId = await getDbUserId();
    if(!userId) return [];

    const notifications = await prisma.notification.findMany({
        where:{
            userId,
        },
        include:{
            creator:{
                select:{
                    id:true,
                    name: true,
                    username: true,
                    image: true,
                },
            },
            post:{
                select:{
                    id:true,
                    content: true,
                    createdAt: true,
                    image: true,
                },
            },
            comment:{
                select:{
                    id: true,
                    content: true,
                    createdAt: true,
                },
            },
        },
        orderBy:{
            createdAt:"desc",
        },
    });

    return notifications;
  } catch (error) {
    console.error("Error to fetching notifications:", JSON.stringify(error));
    throw new Error("Failed to fetch notifications");
  }
};

const markNotificationsAsRead = async (notificationIds: string[]) =>{
    try {
        await prisma.notification.updateMany({
            where:{
                id:{
                    in: notificationIds,
                },
            },
            data:{
                read: true,
            },
        });

        return {success: true};
    } catch (error) {
        console.error("Error occured marking notification as read", JSON.stringify(error));
        return {success:false}
    }
}

export {
    getNotifications,
    markNotificationsAsRead,
}