"use client";
import { useRouter } from "next/navigation";
export function DeleteApplicationButton({ id }: { id: string }) { const router=useRouter(); async function remove(){if(!window.confirm("Delete this application permanently?"))return;const response=await fetch(`/api/staff/applications/${id}`,{method:"DELETE"});if(response.ok)router.refresh();else alert((await response.json()).error||"Could not delete application.");}return <button className="button ghost" style={{padding:"7px 10px",marginLeft:8}} onClick={remove}>Delete</button> }
