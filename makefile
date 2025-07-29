VER=0.1.2

release:
	sed -i '' "s/version\": \".*/version\": \"$(VER)\",/" package.json
	docker build -t paddlepop1/crondiwa .
	docker tag paddlepop1/crondiwa paddlepop1/crondiwa:$(VER)
	docker push paddlepop1/crondiwa:latest
	docker push paddlepop1/crondiwa:$(VER)
