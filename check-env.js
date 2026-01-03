// Quick script to check if .env.local file exists and is readable
import { readFileSync } from 'fs'
import { existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')

console.log('🔍 Checking .env.local file...')
console.log('📁 Expected location:', envPath)
console.log('✅ File exists:', existsSync(envPath))

if (existsSync(envPath)) {
  try {
    const content = readFileSync(envPath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    
    console.log(`📄 File has ${lines.length} lines`)
    
    const firebaseVars = lines.filter(line => line.startsWith('VITE_FIREBASE'))
    console.log(`🔥 Found ${firebaseVars.length} Firebase variables:`)
    
    firebaseVars.forEach(line => {
      const [key] = line.split('=')
      console.log(`   - ${key}`)
    })
    
    if (firebaseVars.length === 0) {
      console.log('❌ No VITE_FIREBASE variables found!')
      console.log('💡 Make sure all variables start with VITE_FIREBASE_')
    }
  } catch (error) {
    console.error('❌ Error reading file:', error.message)
  }
} else {
  console.log('❌ .env.local file not found!')
  console.log('💡 Create it in the project root with your Firebase credentials')
}

