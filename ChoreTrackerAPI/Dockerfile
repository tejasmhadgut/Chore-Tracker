# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder

WORKDIR /src

# Copy project file
COPY ChoreTrackerAPI.csproj .

# Restore packages
RUN dotnet restore ChoreTrackerAPI.csproj

# Copy source code
COPY . .

# Build the application
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM builder AS publish
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -sf http://localhost:5000/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "ChoreTrackerAPI.dll"]
