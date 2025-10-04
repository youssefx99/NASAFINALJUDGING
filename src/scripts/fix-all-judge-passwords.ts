import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function fixAllJudgePasswords() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  try {
    console.log('🔧 Fixing all judge passwords...\n');

    // Get all judges
    const judges = await userModel.find({ role: 'judge' }).exec();

    if (judges.length === 0) {
      console.log('❌ No judges found');
      return;
    }

    console.log(`Found ${judges.length} judges to fix\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (let i = 0; i < judges.length; i++) {
      const judge = judges[i];
      const firstName = judge.name.split(' ')[0];

      // Generate the correct password based on the original logic
      const correctPassword = `${i + 1}${firstName}`;

      // Check if the current password hash is already correct (bcrypt hash)
      if (judge.passwordHash && judge.passwordHash.startsWith('$2b$')) {
        // It's already a bcrypt hash, verify it's correct
        try {
          const isCorrect = await bcrypt.compare(
            correctPassword,
            judge.passwordHash,
          );
          if (isCorrect) {
            console.log(
              `✅ Already correct: ${i + 1}. ${judge.name} - Password: ${correctPassword}`,
            );
            alreadyCorrectCount++;
            continue;
          }
        } catch (error) {
          // If comparison fails, we'll rehash it
        }
      }

      // Hash with bcrypt
      const correctHash = await bcrypt.hash(correctPassword, 10);

      // Update the judge's password hash
      await userModel.updateOne(
        { _id: judge._id },
        { passwordHash: correctHash },
      );

      console.log(
        `🔧 Fixed: ${i + 1}. ${judge.name} - Password: ${correctPassword}`,
      );
      fixedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total judges: ${judges.length}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`\n🎉 All judge passwords are now correct!`);
    console.log(
      '\nYou can now login with the credentials using format: {counter}{FirstName}',
    );
    console.log('Example: 1Hossam, 2Nezar, 3George, etc.');
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await app.close();
  }
}

// Run the fix
fixAllJudgePasswords().catch(console.error);
