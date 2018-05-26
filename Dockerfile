FROM mhart/alpine-node:8
COPY . .
EXPOSE 3000
CMD ["npm","run","start:prod"]
