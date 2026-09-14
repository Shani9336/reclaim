import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient, Category, ItemType, SpaceType, Role } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const defaultPassword = hashPassword('password123');

  // Clean existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.match.deleteMany();
  await prisma.report.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.item.deleteMany();
  await prisma.space.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────
  console.log('Creating users...');
  const leader = await prisma.user.create({
    data: {
      name: 'Shani (Project Leader)',
      email: 'shaniyadav777am@gmail.com',
      password: defaultPassword,
      role: Role.SUPER_ADMIN,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shani',
      showEmail: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@foundit.app',
      password: defaultPassword,
      role: Role.ADMIN,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      showEmail: true,
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Kumar',
      email: 'alice@example.com',
      password: defaultPassword,
      role: Role.USER,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      phone: '+91-9876543210',
      showPhone: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Sharma',
      email: 'bob@example.com',
      password: defaultPassword,
      role: Role.FINDER,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      showEmail: true,
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: 'Carol Singh',
      email: 'carol@example.com',
      password: defaultPassword,
      role: Role.USER,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
    },
  });

  const dave = await prisma.user.create({
    data: {
      name: 'Dave Patel',
      email: 'dave@example.com',
      password: defaultPassword,
      role: Role.FINDER,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
      showEmail: true,
      showPhone: true,
    },
  });

  console.log('✅ Users created (including Project Leader)');

  // ── Spaces ───────────────────────────────────────────────────
  console.log('Creating spaces...');
  const campus = await prisma.space.create({
    data: {
      name: 'Devkiba College',
      type: SpaceType.CAMPUS,
      description: 'Devkiba Mohansinhji Chauhan College of Commerce & Science, Silvassa',
      address: 'Devkiba College Campus, Silvassa',
      city: 'Silvassa',
      state: 'Dadra and Nagar Haveli',
      lat: 20.2707,
      lng: 73.0083,
      adminId: leader.id,
    },
  });

  const mall = await prisma.space.create({
    data: {
      name: 'Inorbit Mall',
      type: SpaceType.MALL,
      description: 'Inorbit Mall, Vashi',
      address: 'Plot No. 39/1, Sector 30A',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      lat: 19.0752,
      lng: 72.9987,
      adminId: admin.id,
    },
  });

  const metro = await prisma.space.create({
    data: {
      name: 'Belapur Metro Station',
      type: SpaceType.METRO,
      description: 'CBD Belapur Metro Station',
      address: 'CBD Belapur, Sector 11',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      lat: 19.0213,
      lng: 73.0391,
      adminId: admin.id,
    },
  });

  console.log('✅ Spaces created');

  // ── Lost Items (created sequentially) ────────────────────────
  console.log('Creating lost items...');
  const lostItemsData = [
    {
      type: ItemType.LOST,
      title: 'Lost iPhone 15 Pro Max',
      description: 'Lost my black iPhone 15 Pro Max with a dark blue case. Has a cracked screen protector. Last seen near the college canteen around lunch time.',
      category: Category.ELECTRONICS,
      color: 'Black',
      brand: 'Apple',
      tags: ['iphone', 'smartphone', 'apple', 'phone', 'mobile'],
      dateLost: new Date('2024-09-10'),
      timeLost: '12:30 PM - 2:00 PM',
      locationText: 'Devkiba College Canteen, Silvassa',
      locationLat: 20.2707,
      locationLng: 73.0083,
      distinctiveFeatures: 'Blue case with a small scratch on the back. Wallpaper is a photo of a golden retriever.',
      reward: '₹2,000 reward for return',
      userId: alice.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Student ID Card',
      description: 'Lost my university ID card. It has my photo, name Alice Kumar, and student number 2021CS045.',
      category: Category.DOCUMENTS,
      color: 'Blue',
      tags: ['id card', 'student id', 'identity', 'documents', 'university card'],
      dateLost: new Date('2024-09-11'),
      timeLost: '9:00 AM - 11:00 AM',
      locationText: 'Devkiba College Library',
      locationLat: 20.2707,
      locationLng: 73.0083,
      distinctiveFeatures: 'Blue and white card with university logo. Has my photo on the right side.',
      userId: alice.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Black Leather Wallet',
      description: 'Lost my black leather wallet. Contains debit cards, some cash (around ₹500), and my driving license.',
      category: Category.WALLET,
      color: 'Black',
      brand: 'Hidesign',
      tags: ['wallet', 'leather', 'black', 'cash', 'cards'],
      dateLost: new Date('2024-09-09'),
      timeLost: '3:00 PM - 5:00 PM',
      locationText: 'Inorbit Mall Food Court, Vashi',
      locationLat: 19.0755,
      locationLng: 72.999,
      distinctiveFeatures: 'Hidesign brand, initials B.S. embossed inside. Lucky charm keychain attached.',
      reward: '₹500 reward',
      userId: bob.id,
      spaceId: mall.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost House Keys',
      description: 'Lost a bunch of keys with a red keychain. Has 3 keys — main door, bedroom, and padlock.',
      category: Category.KEYS,
      color: 'Silver',
      tags: ['keys', 'keychain', 'red', 'house keys', 'door keys'],
      dateLost: new Date('2024-09-12'),
      timeLost: '6:00 PM - 8:00 PM',
      locationText: 'Belapur Metro Station Platform 2',
      locationLat: 19.0215,
      locationLng: 73.0394,
      distinctiveFeatures: 'Red rubber keychain with a small panda charm. One key has a blue rubber cap.',
      userId: carol.id,
      spaceId: metro.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Laptop Backpack',
      description: 'Lost a grey and black Wildcraft laptop backpack. Contains a 15-inch laptop, charger, and notebooks.',
      category: Category.BAGS,
      color: 'Grey',
      brand: 'Wildcraft',
      tags: ['backpack', 'laptop bag', 'wildcraft', 'grey', 'bag'],
      dateLost: new Date('2024-09-08'),
      timeLost: '10:00 AM - 12:00 PM',
      locationText: 'Devkiba College Lecture Hall Block B',
      locationLat: 20.2707,
      locationLng: 73.0083,
      distinctiveFeatures: 'Wildcraft grey/black. Red tag on zipper. Name tag inside reads Carol Singh.',
      reward: '₹1,000 reward. Important project files inside.',
      userId: carol.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Gold Necklace',
      description: 'Lost a thin gold chain necklace with a small Om pendant. Very sentimental family heirloom.',
      category: Category.JEWELRY,
      color: 'Gold',
      tags: ['necklace', 'gold', 'chain', 'om pendant', 'jewelry'],
      dateLost: new Date('2024-09-07'),
      locationText: 'Inorbit Mall, near the trial rooms',
      locationLat: 19.075,
      locationLng: 72.9985,
      distinctiveFeatures: '22 carat gold chain, 16 inches. Om pendant 1cm diameter.',
      reward: '₹5,000 reward. Sentimental heirloom.',
      userId: alice.id,
      spaceId: mall.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Blue Denim Jacket',
      description: 'Left my denim jacket on a seat in the metro. Light wash blue, medium size.',
      category: Category.CLOTHING,
      color: 'Blue',
      brand: "Levi's",
      tags: ['jacket', 'denim', 'blue', 'clothing'],
      dateLost: new Date('2024-09-13'),
      timeLost: '8:30 AM - 9:00 AM',
      locationText: 'Belapur to Vashi Metro Train',
      locationLat: 19.0213,
      locationLng: 73.0391,
      distinctiveFeatures: "Levi's light wash denim, size M. Squid Game enamel pin on left lapel.",
      userId: dave.id,
      spaceId: metro.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost AirPods Pro',
      description: 'Lost white AirPods Pro (2nd gen) with case. Engraved initials D.P. on the case.',
      category: Category.ELECTRONICS,
      color: 'White',
      brand: 'Apple',
      tags: ['airpods', 'earbuds', 'apple', 'white', 'audio'],
      dateLost: new Date('2024-09-11'),
      timeLost: '4:00 PM - 6:00 PM',
      locationText: 'Devkiba College Sports Complex',
      locationLat: 20.2707,
      locationLng: 73.0083,
      distinctiveFeatures: 'White case with D.P. engraved on lid.',
      reward: '₹500 reward',
      userId: dave.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Samsung Galaxy Watch',
      description: 'Lost my Samsung Galaxy Watch Classic in black color.',
      category: Category.ELECTRONICS,
      color: 'Black',
      brand: 'Samsung',
      tags: ['smartwatch', 'samsung', 'watch', 'wearable'],
      dateLost: new Date('2024-09-10'),
      locationText: 'Inorbit Mall Food Court Level 2',
      locationLat: 19.0753,
      locationLng: 72.9988,
      distinctiveFeatures: 'Black stainless steel case, black leather strap.',
      reward: '₹1,500 reward',
      userId: carol.id,
      spaceId: mall.id,
    },
    {
      type: ItemType.LOST,
      title: 'Lost Indian Passport',
      description: 'Lost Indian passport (navy blue cover). Urgently needed for upcoming travel.',
      category: Category.DOCUMENTS,
      color: 'Navy Blue',
      tags: ['passport', 'documents', 'identity', 'travel'],
      dateLost: new Date('2024-09-12'),
      locationText: 'Navi Mumbai Airport Area',
      locationLat: 19.1665,
      locationLng: 72.9541,
      distinctiveFeatures: 'Navy blue Indian passport with Singapore and UAE visa stamps.',
      reward: '₹3,000 reward. Urgently needed.',
      userId: bob.id,
    },
  ];

  const lostItems = [];
  for (const itemData of lostItemsData) {
    const item = await prisma.item.create({ data: itemData });
    lostItems.push(item);
  }
  console.log(`✅ ${lostItems.length} lost items created`);

  // ── Found Items (created sequentially) ───────────────────────
  console.log('Creating found items...');
  const foundItemsData = [
    {
      type: ItemType.FOUND,
      title: 'Found iPhone — Black with Blue Case',
      description: 'Found a black iPhone with a dark blue protective case near the university canteen. Screen protector has a crack. Wallpaper is personal photo.',
      category: Category.ELECTRONICS,
      color: 'Black',
      brand: 'Apple',
      tags: ['iphone', 'smartphone', 'apple', 'phone', 'mobile', 'blue case'],
      dateFound: new Date('2024-09-10'),
      locationText: 'Devkiba College, near Main Canteen',
      locationLat: 20.2707,
      locationLng: 73.0083,
      storageLocation: 'Security Office, Ground Floor, Admin Block',
      handoverInstructions: 'Visit security office with college ID between 9 AM - 5 PM.',
      userId: dave.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found University Student ID Card',
      description: 'Found a Devkiba College student ID card in Computer Science department.',
      category: Category.DOCUMENTS,
      color: 'Blue',
      tags: ['id card', 'student id', 'documents', 'university'],
      dateFound: new Date('2024-09-11'),
      locationText: 'Devkiba College Library, 2nd Floor',
      locationLat: 20.2707,
      locationLng: 73.0083,
      storageLocation: 'Library Reception Desk',
      handoverInstructions: 'Collect from library reception desk. Bring another ID proof.',
      userId: bob.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Black Leather Wallet',
      description: 'Found a black leather wallet in the food court. Contains cash and cards.',
      category: Category.WALLET,
      color: 'Black',
      tags: ['wallet', 'leather', 'black', 'cash', 'cards'],
      dateFound: new Date('2024-09-09'),
      locationText: 'Inorbit Mall Food Court',
      locationLat: 19.0754,
      locationLng: 72.9989,
      storageLocation: 'Mall Security Office, Ground Floor',
      handoverInstructions: 'Visit mall security with photo ID. Open 10 AM - 9 PM.',
      userId: alice.id,
      spaceId: mall.id,
      visibility: 'PRIVATE' as const,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Keys with Red Keychain',
      description: 'Found a set of keys with a red rubber keychain and a small panda charm on metro platform.',
      category: Category.KEYS,
      color: 'Silver',
      tags: ['keys', 'keychain', 'red', 'panda charm', 'metro'],
      dateFound: new Date('2024-09-12'),
      locationText: 'Belapur Metro Station, Platform 2',
      locationLat: 19.0214,
      locationLng: 73.0393,
      storageLocation: 'Metro Station Lost & Found Counter',
      handoverInstructions: 'Contact Belapur Metro Station office with ID proof.',
      userId: carol.id,
      spaceId: metro.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found White Earbuds with Case',
      description: 'Found white wireless earbuds with charging case in the gym area. Case has engraved initials.',
      category: Category.ELECTRONICS,
      color: 'White',
      brand: 'Apple',
      tags: ['earbuds', 'airpods', 'apple', 'white', 'wireless'],
      dateFound: new Date('2024-09-11'),
      locationText: 'Devkiba College Sports Complex',
      locationLat: 20.2707,
      locationLng: 73.0083,
      storageLocation: 'Gym Reception Counter',
      handoverInstructions: 'Collect from gym reception. Tell us the engraving on the case.',
      userId: alice.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Grey Wildcraft Backpack',
      description: 'Found a grey and black Wildcraft backpack in Lecture Hall B. Contains a laptop and study materials.',
      category: Category.BAGS,
      color: 'Grey',
      brand: 'Wildcraft',
      tags: ['backpack', 'wildcraft', 'grey', 'bag', 'laptop bag'],
      dateFound: new Date('2024-09-08'),
      locationText: 'Devkiba College, Lecture Hall Block B, Room 203',
      locationLat: 20.2707,
      locationLng: 73.0083,
      storageLocation: 'Department Office, Ground Floor',
      handoverInstructions: 'Contact CSE department office with your ID. Name tag will be verified.',
      userId: bob.id,
      spaceId: campus.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Blue Denim Jacket',
      description: 'Found a light blue denim jacket left on a metro seat. Has an enamel pin on the lapel.',
      category: Category.CLOTHING,
      color: 'Blue',
      brand: "Levi's",
      tags: ['jacket', 'denim', 'blue', 'clothing', 'enamel pin'],
      dateFound: new Date('2024-09-13'),
      locationText: 'Belapur Metro, Train towards Vashi',
      locationLat: 19.0216,
      locationLng: 73.0392,
      storageLocation: 'Belapur Metro Station Lost & Found Office',
      handoverInstructions: 'Describe the enamel pin to claim ownership.',
      userId: carol.id,
      spaceId: metro.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Samsung Smartwatch',
      description: 'Found a black Samsung smartwatch near the food court.',
      category: Category.ELECTRONICS,
      color: 'Black',
      brand: 'Samsung',
      tags: ['smartwatch', 'samsung', 'watch', 'wearable'],
      dateFound: new Date('2024-09-10'),
      locationText: 'Inorbit Mall Food Court Level 2',
      locationLat: 19.0754,
      locationLng: 72.9989,
      storageLocation: 'Mall Customer Service Desk, Level 1',
      handoverInstructions: 'Describe the watch face and strap details to claim.',
      userId: dave.id,
      spaceId: mall.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Indian Passport',
      description: 'Found an Indian passport near the airport area. Deposited with local police for safety.',
      category: Category.DOCUMENTS,
      color: 'Navy Blue',
      tags: ['passport', 'documents', 'india', 'travel', 'identity'],
      dateFound: new Date('2024-09-12'),
      locationText: 'Near Navi Mumbai Airport Area',
      locationLat: 19.1666,
      locationLng: 72.9542,
      storageLocation: 'Turbhe Police Station, Lost Property Counter',
      handoverInstructions: 'Visit Turbhe Police Station with photo ID.',
      userId: alice.id,
    },
    {
      type: ItemType.FOUND,
      title: 'Found Gold Chain Necklace',
      description: 'Found a thin gold chain with a religious pendant in the mall near trial rooms.',
      category: Category.JEWELRY,
      color: 'Gold',
      tags: ['necklace', 'gold', 'chain', 'pendant', 'jewelry'],
      dateFound: new Date('2024-09-07'),
      locationText: 'Inorbit Mall Fashion Section near Trial Rooms',
      locationLat: 19.0751,
      locationLng: 72.9986,
      storageLocation: 'Mall Customer Service Desk, Level 1',
      handoverInstructions: 'Describe the pendant in detail to verify ownership.',
      userId: bob.id,
      spaceId: mall.id,
    },
  ];

  const foundItems = [];
  for (const itemData of foundItemsData) {
    const item = await prisma.item.create({ data: itemData });
    foundItems.push(item);
  }
  console.log(`✅ ${foundItems.length} found items created`);

  // ── Matches (created sequentially) ───────────────────────────
  console.log('Creating matches...');
  const matchesData = [
    {
      lostItemId: lostItems[0].id,
      foundItemId: foundItems[0].id,
      score: 0.94,
      reasoning: { text: 0.92, category: 1.0, color: 1.0, date: 1.0 },
      status: 'CONFIRMED' as const,
    },
    {
      lostItemId: lostItems[1].id,
      foundItemId: foundItems[1].id,
      score: 0.88,
      reasoning: { text: 0.85, category: 1.0, color: 1.0, date: 1.0 },
      status: 'PENDING' as const,
    },
    {
      lostItemId: lostItems[2].id,
      foundItemId: foundItems[2].id,
      score: 0.91,
      reasoning: { text: 0.88, category: 1.0, color: 1.0, date: 1.0 },
      status: 'PENDING' as const,
    },
    {
      lostItemId: lostItems[3].id,
      foundItemId: foundItems[3].id,
      score: 0.97,
      reasoning: { text: 0.95, category: 1.0, color: 1.0, date: 1.0 },
      status: 'CONFIRMED' as const,
    },
    {
      lostItemId: lostItems[7].id,
      foundItemId: foundItems[4].id,
      score: 0.85,
      reasoning: { text: 0.82, category: 1.0, color: 1.0, date: 0.8 },
      status: 'PENDING' as const,
    },
  ];

  for (const matchData of matchesData) {
    await prisma.match.create({ data: matchData });
  }
  console.log('✅ Matches created');

  // ── Notifications ────────────────────────────────────────────
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        type: 'MATCH_FOUND',
        title: 'Match Found! 94% match for your iPhone',
        body: 'We found a likely match for your lost iPhone 15 Pro Max!',
        link: '/matches',
        read: false,
      },
      {
        userId: alice.id,
        type: 'MATCH_FOUND',
        title: 'Match Found! 88% match for your Student ID',
        body: 'Someone found a university ID card matching your description at the library.',
        link: '/matches',
        read: true,
      },
      {
        userId: bob.id,
        type: 'MATCH_FOUND',
        title: 'Match Found! 91% match for your Wallet',
        body: 'A black leather wallet was found at the Inorbit Mall food court.',
        link: '/matches',
        read: false,
      },
    ],
  });
  console.log('✅ Notifications created');

  console.log('\n🎉 Database seeded successfully!');
  console.log(`   Users: 5`);
  console.log(`   Spaces: 3`);
  console.log(`   Lost items: ${lostItems.length}`);
  console.log(`   Found items: ${foundItems.length}`);
  console.log(`   Matches: 5`);
  console.log(`   Notifications: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
