#!/usr/bin/env node

/**
 * FUNDLI Presentation Setup Script
 * Ensures everything is ready for your presentation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FUNDLI Presentation Setup');
console.log('============================\n');

// Check if backend is running
function checkBackend() {
  try {
    const response = execSync('curl -s https://fundli-hjqn.vercel.app/api/health', { encoding: 'utf8' });
    const health = JSON.parse(response);
    console.log('✅ Backend Server: RUNNING');
    console.log(`   Database: ${health.database}`);
    console.log(`   Status: ${health.status}`);
    return true;
  } catch (error) {
    console.log('❌ Backend Server: NOT RUNNING');
    console.log('   Please start the backend server first:');
    console.log('   cd FUNDLI-Backend && npm run dev');
    return false;
  }
}

// Check if frontend is accessible
function checkFrontend() {
  try {
    const response = execSync('curl -s http://localhost:5173', { encoding: 'utf8' });
    if (response.includes('FUNDLI') || response.includes('React')) {
      console.log('✅ Frontend Server: RUNNING');
      return true;
    }
  } catch (error) {
    // Ignore curl errors, check if process is running
  }
  
  console.log('❌ Frontend Server: NOT RUNNING');
  console.log('   Please start the frontend server:');
  console.log('   cd FUNDLI && npm run dev');
  return false;
}

// Test login functionality
function testLogin() {
  try {
    const response = execSync('curl -s -X POST https://fundli-hjqn.vercel.app/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test@fundli.com","password":"TestPassword123"}\'', { encoding: 'utf8' });
    const loginResult = JSON.parse(response);
    
    if (loginResult.status === 'success') {
      console.log('✅ Test Login: SUCCESSFUL');
      console.log(`   User: ${loginResult.data.user.email}`);
      console.log(`   User Type: ${loginResult.data.user.userType}`);
      return true;
    } else {
      console.log('❌ Test Login: FAILED');
      console.log(`   Error: ${loginResult.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Test Login: FAILED');
    console.log('   Could not connect to backend');
    return false;
  }
}

// Check key files exist
function checkFiles() {
  const keyFiles = [
    'FUNDLI/src/context/AuthContext.jsx',
    'FUNDLI/src/pages/auth/Login.jsx',
    'FUNDLI/src/pages/dashboard/BorrowerDashboard.jsx',
    'FUNDLI/src/pages/dashboard/LenderDashboard.jsx',
    'FUNDLI-Backend/src/routes/auth.js',
    'FUNDLI-Backend/src/models/User.js'
  ];
  
  let allFilesExist = true;
  
  keyFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Main setup check
function main() {
  console.log('Checking presentation readiness...\n');
  
  const backendOk = checkBackend();
  const frontendOk = checkFrontend();
  const loginOk = testLogin();
  const filesOk = checkFiles();
  
  console.log('\n📋 Presentation Readiness Summary:');
  console.log('==================================');
  
  if (backendOk && frontendOk && loginOk && filesOk) {
    console.log('🎉 EVERYTHING IS READY FOR YOUR PRESENTATION!');
    console.log('\n📱 Demo Credentials:');
    console.log('   Email: test@fundli.com');
    console.log('   Password: TestPassword123');
    console.log('   User Type: Borrower');
    console.log('\n🌐 Access URLs:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend API: https://fundli-hjqn.vercel.app/api');
    console.log('\n🚀 You\'re all set to present gloriously!');
  } else {
    console.log('⚠️  Some issues need to be resolved before presentation');
    console.log('\n🔧 Quick Fix Commands:');
    if (!backendOk) {
      console.log('   Backend: cd FUNDLI-Backend && npm run dev');
    }
    if (!frontendOk) {
      console.log('   Frontend: cd FUNDLI && npm run dev');
    }
  }
  
  console.log('\n📖 Don\'t forget to review the presentation guide:');
  console.log('   FUNDLI_PRESENTATION_GUIDE.md');
}

// Run the setup check
main();
