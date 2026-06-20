#!/bin/bash

# ChoreTrack Frontend Deployment Script
# Builds frontend and deploys to S3 + CloudFront
# Usage: ./deploy.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ChoreTrack Frontend Deployment${NC}"
echo ""

# Configuration - Update these with your AWS values
BUCKET_NAME="choretrack-frontend-assets"  # Your S3 bucket name
DISTRIBUTION_ID=""  # Your CloudFront Distribution ID (leave empty for now)
AWS_REGION="us-east-1"

# Check if DISTRIBUTION_ID is set
if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}⚠️  CloudFront Distribution ID not set!${NC}"
    echo "   Update DISTRIBUTION_ID in deploy.sh with your CloudFront distribution ID"
    echo ""
    echo "   To find your CloudFront Distribution ID:"
    echo "   1. Go to AWS Console → CloudFront"
    echo "   2. Find your frontend distribution"
    echo "   3. Copy the Distribution ID (e.g., D123456ABC)"
    echo ""
fi

# Step 1: Build frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${YELLOW}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Step 2: Upload to S3
echo -e "${BLUE}📤 Uploading to S3 (s3://$BUCKET_NAME)...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --delete \
    --region "$AWS_REGION" \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "index.html"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Assets uploaded${NC}"
else
    echo -e "${YELLOW}❌ S3 upload failed${NC}"
    exit 1
fi

echo ""

# Upload HTML files with short cache TTL (so users get new asset hashes)
echo -e "${BLUE}📝 Uploading HTML files...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --region "$AWS_REGION" \
    --cache-control "public, max-age=300, must-revalidate" \
    --include "*.html" \
    --delete

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ HTML uploaded${NC}"
else
    echo -e "${YELLOW}❌ HTML upload failed${NC}"
    exit 1
fi

echo ""

# Step 3: Invalidate CloudFront cache
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${BLUE}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --region "$AWS_REGION"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CloudFront invalidation initiated${NC}"
    else
        echo -e "${YELLOW}⚠️  CloudFront invalidation failed (non-critical)${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping CloudFront invalidation (ID not set)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌍 Your app is live at:"
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "   https://d[xxx].cloudfront.net (or your custom domain)"
else
    echo "   s3://$BUCKET_NAME/"
    echo "   (Configure CloudFront in deploy.sh to enable CDN)"
fi
