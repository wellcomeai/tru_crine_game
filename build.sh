#!/bin/bash
# Build frontend before starting backend
cd frontend
npm install
npm run build
cd ..
