import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create household
  const household = await prisma.household.create({
    data: {
      name: 'The Smiths',
      timezone: 'America/New_York',
      settings: {
        approval_required_default: true,
        points_enabled: true,
        reminders_enabled: true,
      },
    },
  });
  console.log(`Created household: ${household.name} (${household.id})`);

  // 2. Create parent user
  const passwordHash = await argon2.hash('password123');
  const parent = await prisma.user.create({
    data: {
      household_id: household.id,
      email: 'parent@example.com',
      password_hash: passwordHash,
      display_name: 'Mom',
      role: 'parent',
      is_active: true,
    },
  });
  console.log(`Created parent: ${parent.display_name} (${parent.id})`);

  // 3. Create child profiles
  const child1 = await prisma.user.create({
    data: {
      household_id: household.id,
      display_name: 'Alex',
      role: 'child',
      avatar_color: '#4CAF50',
      avatar_icon: 'star',
      age: 10,
      is_active: true,
    },
  });

  const child2 = await prisma.user.create({
    data: {
      household_id: household.id,
      display_name: 'Jordan',
      role: 'child',
      avatar_color: '#2196F3',
      avatar_icon: 'rocket',
      age: 8,
      is_active: true,
    },
  });
  console.log(`Created children: ${child1.display_name}, ${child2.display_name}`);

  // 4. Create household memberships
  await prisma.householdMembership.createMany({
    data: [
      { household_id: household.id, user_id: parent.id, role: 'parent' },
      { household_id: household.id, user_id: child1.id, role: 'child' },
      { household_id: household.id, user_id: child2.id, role: 'child' },
    ],
  });
  console.log('Created household memberships');

  // 5. Create sample chores
  const choreCleanRoom = await prisma.chore.create({
    data: {
      household_id: household.id,
      title: 'Clean bedroom',
      description: 'Make bed, pick up toys, vacuum floor',
      points: 10,
      recurrence_type: 'daily',
      assignee_mode: 'single',
      assigned_child_id: child1.id,
      approval_required: true,
    },
  });

  const choreDishes = await prisma.chore.create({
    data: {
      household_id: household.id,
      title: 'Wash dishes',
      description: 'Rinse and load the dishwasher after dinner',
      points: 5,
      recurrence_type: 'daily',
      assignee_mode: 'rotation',
      approval_required: true,
    },
  });

  const choreTrash = await prisma.chore.create({
    data: {
      household_id: household.id,
      title: 'Take out trash',
      description: 'Empty all trash cans and bring bins to the curb',
      points: 8,
      recurrence_type: 'weekly',
      recurrence_config: [3], // Wednesday
      assignee_mode: 'single',
      assigned_child_id: child2.id,
      approval_required: false,
    },
  });

  const choreHomework = await prisma.chore.create({
    data: {
      household_id: household.id,
      title: 'Finish homework',
      description: 'Complete all school assignments for the day',
      points: 15,
      recurrence_type: 'weekdays',
      assignee_mode: 'single',
      approval_required: true,
    },
  });
  console.log('Created chores: Clean bedroom, Wash dishes, Take out trash, Finish homework');

  // 6. Set up rotation group for dishes chore
  const rotationGroup = await prisma.rotationGroup.create({
    data: {
      chore_id: choreDishes.id,
      current_index: 0,
      members: {
        create: [
          { child_id: child1.id, order_index: 0 },
          { child_id: child2.id, order_index: 1 },
        ],
      },
    },
  });
  console.log(`Created rotation group for "${choreDishes.title}"`);

  // 7. Create a sample assignment (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignment = await prisma.choreAssignment.create({
    data: {
      household_id: household.id,
      chore_id: choreCleanRoom.id,
      assigned_child_id: child1.id,
      effective_date: today,
      status: 'pending',
    },
  });
  console.log(`Created assignment for "${choreCleanRoom.title}" → ${child1.display_name}`);

  // 8. Create notification preferences
  await prisma.notificationPreference.createMany({
    data: [
      {
        household_id: household.id,
        user_id: parent.id,
        reminders_enabled: true,
        overdue_alerts_enabled: true,
        approval_alerts_enabled: true,
      },
      {
        household_id: household.id,
        user_id: child1.id,
        reminders_enabled: true,
        overdue_alerts_enabled: false,
        approval_alerts_enabled: false,
      },
      {
        household_id: household.id,
        user_id: child2.id,
        reminders_enabled: true,
        overdue_alerts_enabled: false,
        approval_alerts_enabled: false,
      },
    ],
  });
  console.log('Created notification preferences');

  console.log('\nSeed complete!');
  console.log(`  Household: ${household.name}`);
  console.log(`  Parent:    ${parent.email}`);
  console.log(`  Children:  ${child1.display_name}, ${child2.display_name}`);
  console.log(`  Chores:    ${4} created`);
  console.log(`  Password:  password123`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
