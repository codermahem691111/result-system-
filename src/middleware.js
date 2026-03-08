import { NextResponse } from "next/server";

export function middleware(request) {

const { pathname } = request.nextUrl;

if(pathname.startsWith("/teacher/dashboard")){
const token = request.cookies.get("teacherToken")?.value;
if(!token){
return NextResponse.redirect(new URL("/teacher/register",request.url));
}
}

if(pathname.startsWith("/student/dashboard")){
const token = request.cookies.get("studentToken")?.value;
if(!token){
return NextResponse.redirect(new URL("/student/register",request.url));
}
}

if(pathname.startsWith("/admin/dashboard")){

const token = request.cookies.get("adminToken")?.value;

if(!token){

return NextResponse.redirect(
new URL("/admin",request.url)
);

}

}

return NextResponse.next();

}

export const config = {
matcher:[
"/teacher/dashboard/:path*",
"/student/dashboard/:path*",
"/admin/dashboard/:path*"
]
};