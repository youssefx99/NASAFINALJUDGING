import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  try {
    // Get command line arguments or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@nasa.com';
    const password = args[1] || 'admin123';
    const name = args[2] || 'Administrator';

    console.log('Creating admin user...');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email }).exec();

    if (existingAdmin) {
      console.log(`❌ Admin user with email ${email} already exists!`);
      console.log(
        'If you want to update the password, please delete the existing user first.',
      );
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const admin = new userModel({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'admin',
      panelAssignments: [],
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('\nAdmin Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}`);
    console.log(
      '\n⚠️  Please change the password after first login for security!',
    );
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

// Run the script
createAdmin().catch(console.error);
