import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/staff";
const input=z.object({id:z.string().optional(),label:z.string().trim().min(3).max(250),description:z.string().trim().max(1000).optional(),required:z.boolean(),active:z.boolean(),sortOrder:z.number().int().min(0)});
export async function POST(request:NextRequest){await requirePermission("website.edit");const data=input.safeParse(await request.json());if(!data.success)return NextResponse.json({error:"Invalid question."},{status:400});const key=data.data.id?undefined:`question_${Date.now()}`;const question=data.data.id?await prisma.applicationQuestion.update({where:{id:data.data.id},data:data.data}):await prisma.applicationQuestion.create({data:{...data.data,key:key!}});return NextResponse.json(question)}
export async function DELETE(request:NextRequest){await requirePermission("website.edit");const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Question ID required."},{status:400});await prisma.applicationQuestion.delete({where:{id}});return NextResponse.json({ok:true})}
