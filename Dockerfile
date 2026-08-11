# استخدام خادم Nginx خفيف
FROM nginx:alpine

# مسح الملفات الافتراضية
RUN rm -rf /usr/share/nginx/html/*

# نسخ ملفات الموقع لـ Nginx
COPY . /usr/share/nginx/html

# فتح البورت 80
EXPOSE 80

# تشغيل Nginx
CMD ["nginx", "-g", "daemon off;"]
