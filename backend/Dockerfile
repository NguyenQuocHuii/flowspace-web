# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy csproj files and restore dependencies
COPY src/FlowSpace.Domain/*.csproj ./src/FlowSpace.Domain/
COPY src/FlowSpace.Application/*.csproj ./src/FlowSpace.Application/
COPY src/FlowSpace.Persistence/*.csproj ./src/FlowSpace.Persistence/
COPY src/FlowSpace.Infrastructure/*.csproj ./src/FlowSpace.Infrastructure/
COPY src/FlowSpace.Api/*.csproj ./src/FlowSpace.Api/
COPY src/FlowSpace.slnx ./src/

RUN dotnet restore ./src/FlowSpace.slnx

# Copy everything else and build release
COPY . ./
RUN dotnet publish ./src/FlowSpace.Api/FlowSpace.Api.csproj -c Release -o out

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build-env /app/out .

# Expose port 8080 (Render default port)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://*:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "FlowSpace.Api.dll"]
