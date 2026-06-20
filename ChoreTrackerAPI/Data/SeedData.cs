using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            if (context.Users.Any())
            {
                context.Notifications.RemoveRange(context.Notifications);
                context.ChoreCompletion.RemoveRange(context.ChoreCompletion);
                context.Chores.RemoveRange(context.Chores);
                context.GroupMember.RemoveRange(context.GroupMember);
                context.Groups.RemoveRange(context.Groups);
                context.Users.RemoveRange(context.Users);
                await context.SaveChangesAsync();
            }

            // ── Users ─────────────────────────────────────────────────────────────
            var passwordHasher = new PasswordHasher<ApplicationUser>();
            const string defaultPassword = "Demo@123";

            var users = new[]
            {
                MakeUser("user1", "jane.doe",       "jane@example.com",   "Jane",   "Doe"),
                MakeUser("user2", "marcus.chen",    "marcus@example.com", "Marcus", "Chen"),
                MakeUser("user3", "sara.patel",     "sara@example.com",   "Sara",   "Patel"),
                MakeUser("user4", "tom.riley",      "tom@example.com",    "Tom",    "Riley"),
                MakeUser("user5", "priya.nair",     "priya@example.com",  "Priya",  "Nair"),
                MakeUser("user6", "lucas.torres",   "lucas@example.com",  "Lucas",  "Torres"),
                MakeUser("user7", "emily.park",     "emily@example.com",  "Emily",  "Park"),
                MakeUser("user8", "daniel.kim",     "daniel@example.com", "Daniel", "Kim"),
            };

            foreach (var u in users)
            {
                u.PasswordHash = passwordHasher.HashPassword(u, defaultPassword);
                await context.Users.AddAsync(u);
            }
            await context.SaveChangesAsync();

            // ── Groups ────────────────────────────────────────────────────────────
            var now = DateTime.UtcNow;

            var apartment = new Group { Name = "Apartment Mates",  Description = "Shared apartment cleaning and maintenance",      InviteCode = "APART01", CreatorId = "user1", createdAt = now.AddDays(-90) };
            var family    = new Group { Name = "Family House",      Description = "Family home chores and weekly responsibilities",  InviteCode = "FAMIL02", CreatorId = "user3", createdAt = now.AddDays(-75) };
            var office    = new Group { Name = "Office Team",       Description = "Workspace cleaning and organization",             InviteCode = "OFFIC03", CreatorId = "user2", createdAt = now.AddDays(-60) };
            var fitness   = new Group { Name = "Fitness Center",    Description = "Gym equipment and facility upkeep",               InviteCode = "FITNS04", CreatorId = "user5", createdAt = now.AddDays(-45) };

            await context.Groups.AddRangeAsync(apartment, family, office, fitness);
            await context.SaveChangesAsync();

            // ── Group Members ─────────────────────────────────────────────────────
            var memberships = new[]
            {
                // Apartment: jane, marcus, sara, tom
                GM(apartment.Id, "user1", now.AddDays(-90)),
                GM(apartment.Id, "user2", now.AddDays(-88)),
                GM(apartment.Id, "user3", now.AddDays(-85)),
                GM(apartment.Id, "user4", now.AddDays(-80)),

                // Family: sara, priya, emily, daniel
                GM(family.Id, "user3", now.AddDays(-75)),
                GM(family.Id, "user5", now.AddDays(-74)),
                GM(family.Id, "user7", now.AddDays(-70)),
                GM(family.Id, "user8", now.AddDays(-68)),

                // Office: marcus, tom, priya, lucas
                GM(office.Id, "user2", now.AddDays(-60)),
                GM(office.Id, "user4", now.AddDays(-60)),
                GM(office.Id, "user5", now.AddDays(-58)),
                GM(office.Id, "user6", now.AddDays(-55)),

                // Fitness: jane, lucas, emily, daniel
                GM(fitness.Id, "user5", now.AddDays(-45)),
                GM(fitness.Id, "user6", now.AddDays(-44)),
                GM(fitness.Id, "user7", now.AddDays(-43)),
                GM(fitness.Id, "user8", now.AddDays(-42)),
            };
            await context.GroupMember.AddRangeAsync(memberships);
            await context.SaveChangesAsync();

            // ── Chores ────────────────────────────────────────────────────────────
            var chores = new List<Chore>
            {
                // Apartment
                C("Clean Kitchen",        "Wash dishes, scrub counters, clean stovetop",            apartment.Id, RecurrenceType.Daily,   null, ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(1)),
                C("Scrub Bathrooms",      "Clean toilet, shower, and sink thoroughly",               apartment.Id, RecurrenceType.Weekly,  7,    ChoreDifficulty.Hard,   ChoreStatus.InProgress, now.AddDays(2)),
                C("Vacuum & Mop Floors",  "Vacuum carpets and mop hardwood areas",                   apartment.Id, RecurrenceType.Weekly,  7,    ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(3)),
                C("Take Out Trash",       "Empty all bins and bring bags to the curb",               apartment.Id, RecurrenceType.Daily,   null, ChoreDifficulty.Easy,   ChoreStatus.Done,       now.AddDays(1)),
                C("Laundry Rotation",     "Wash, dry and fold communal linens",                      apartment.Id, RecurrenceType.Weekly,  7,    ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(4)),
                C("Window Cleaning",      "Wipe down all windows and glass surfaces",                apartment.Id, RecurrenceType.Monthly, null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(14)),
                C("Refrigerator Cleanout","Remove expired items and wipe fridge interior",           apartment.Id, RecurrenceType.Monthly, null, ChoreDifficulty.Medium, ChoreStatus.InProgress, now.AddDays(10)),
                C("Grocery Run",          "Pick up shared household essentials",                     apartment.Id, RecurrenceType.Weekly,  7,    ChoreDifficulty.Easy,   ChoreStatus.Todo,       now.AddDays(2)),

                // Family House
                C("Mow the Lawn",         "Cut grass and edge the driveway",                         family.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(3)),
                C("Weekly Grocery Shop",  "Full weekly grocery run for the household",               family.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Medium, ChoreStatus.Done,       now.AddDays(2)),
                C("Cook Family Dinner",   "Prepare a home-cooked dinner for the family",             family.Id,    RecurrenceType.Daily,   null, ChoreDifficulty.Medium, ChoreStatus.InProgress, now.AddDays(1)),
                C("Pool Maintenance",     "Check chemicals and skim the pool",                       family.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(5)),
                C("Car Wash",             "Wash and vacuum both cars",                               family.Id,    RecurrenceType.Monthly, null, ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(12)),
                C("Deep Clean Bedrooms",  "Change bedding, dust surfaces, vacuum floors",            family.Id,    RecurrenceType.Monthly, null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(20)),
                C("Gutter Cleaning",      "Clear gutters and inspect downspouts",                    family.Id,    RecurrenceType.Monthly, null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(25)),
                C("Water Indoor Plants",  "Water all houseplants and check soil moisture",           family.Id,    RecurrenceType.Daily,   null, ChoreDifficulty.Easy,   ChoreStatus.Todo,       now.AddDays(1)),

                // Office
                C("Morning Floor Sweep",  "Sweep and mop the main office floor",                    office.Id,    RecurrenceType.Daily,   null, ChoreDifficulty.Easy,   ChoreStatus.Done,       now.AddDays(1)),
                C("Kitchen Restocking",   "Refill coffee, tea, and snacks in the kitchen",          office.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(2)),
                C("Meeting Room Setup",   "Wipe tables, arrange chairs, check AV equipment",        office.Id,    RecurrenceType.Daily,   null, ChoreDifficulty.Easy,   ChoreStatus.InProgress, now.AddDays(1)),
                C("Desk Sanitizing",      "Wipe down all desks, keyboards, and monitors",           office.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Medium, ChoreStatus.Todo,       now.AddDays(3)),
                C("Printer Paper Refill", "Check and refill all printers and replace toner",        office.Id,    RecurrenceType.Weekly,  7,    ChoreDifficulty.Easy,   ChoreStatus.Todo,       now.AddDays(4)),
                C("End of Day Cleanup",   "Clear desks, lock cabinets, set alarm",                  office.Id,    RecurrenceType.Daily,   null, ChoreDifficulty.Easy,   ChoreStatus.Done,       now.AddDays(1)),
                C("Monthly Supply Order", "Audit and order all depleted office supplies",           office.Id,    RecurrenceType.Monthly, null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(18)),

                // Fitness Center
                C("Wipe Down Equipment",  "Disinfect all machines, weights, and benches",           fitness.Id,   RecurrenceType.Daily,   null, ChoreDifficulty.Medium, ChoreStatus.Done,       now.AddDays(1)),
                C("Mop Gym Floor",        "Mop all flooring including the yoga studio",             fitness.Id,   RecurrenceType.Daily,   null, ChoreDifficulty.Medium, ChoreStatus.InProgress, now.AddDays(1)),
                C("Towel Laundry",        "Wash, dry, and restock all gym towels",                  fitness.Id,   RecurrenceType.Weekly,  7,    ChoreDifficulty.Easy,   ChoreStatus.Todo,       now.AddDays(2)),
                C("Equipment Inspection", "Check all machines for damage or wear",                  fitness.Id,   RecurrenceType.Monthly, null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(15)),
                C("Locker Room Cleanup",  "Clean lockers, sinks, and shower areas",                 fitness.Id,   RecurrenceType.Daily,   null, ChoreDifficulty.Hard,   ChoreStatus.Todo,       now.AddDays(1)),
                C("Restock Supplies",     "Refill soap, paper towels, and cleaning products",      fitness.Id,   RecurrenceType.Weekly,  7,    ChoreDifficulty.Easy,   ChoreStatus.Done,       now.AddDays(3)),
            };

            await context.Chores.AddRangeAsync(chores);
            await context.SaveChangesAsync();

            var allChores = await context.Chores.ToListAsync();
            var aptChores    = allChores.Where(c => c.GroupId == apartment.Id).ToList();
            var famChores    = allChores.Where(c => c.GroupId == family.Id).ToList();
            var offChores    = allChores.Where(c => c.GroupId == office.Id).ToList();
            var fitChores    = allChores.Where(c => c.GroupId == fitness.Id).ToList();

            // ── Completions ───────────────────────────────────────────────────────
            // Each group has a user set with individual activity rates.
            // Rates control how many times that user completed chores over 90 days.
            var rng = new Random(42);
            var completions = new List<ChoreCompletion>();

            void AddCompletions(List<Chore> groupChores, int groupId, (string userId, int count, int[] peakHours)[] members)
            {
                foreach (var (userId, count, peakHours) in members)
                {
                    for (int i = 0; i < count; i++)
                    {
                        var chore   = groupChores[rng.Next(groupChores.Count)];
                        var dayAgo  = rng.Next(0, 90);
                        var hour    = peakHours[rng.Next(peakHours.Length)];
                        var minute  = rng.Next(0, 60);
                        completions.Add(new ChoreCompletion
                        {
                            UserId      = userId,
                            ChoreId     = chore.Id,
                            GroupId     = groupId,
                            CompletedOn = now.AddDays(-dayAgo).Date.AddHours(hour).AddMinutes(minute)
                        });
                    }
                }
            }

            int[] morningHours  = { 7, 8, 9, 10, 11 };
            int[] workdayHours  = { 9, 10, 11, 12, 14, 15, 16, 17 };
            int[] eveningHours  = { 17, 18, 19, 20, 21 };
            int[] allDayHours   = { 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 };

            // Apartment — peak evenings & weekends
            AddCompletions(aptChores, apartment.Id, new[]
            {
                ("user1", 75, eveningHours),   // Jane — top performer
                ("user2", 52, allDayHours),    // Marcus — solid
                ("user3", 38, eveningHours),   // Sara — moderate
                ("user4", 22, morningHours),   // Tom — occasional
            });

            // Family — spread throughout day
            AddCompletions(famChores, family.Id, new[]
            {
                ("user3", 68, allDayHours),    // Sara — most active in family
                ("user5", 55, morningHours),   // Priya — morning person
                ("user7", 40, eveningHours),   // Emily — evenings
                ("user8", 18, allDayHours),    // Daniel — least active
            });

            // Office — strictly work hours
            AddCompletions(offChores, office.Id, new[]
            {
                ("user2", 80, workdayHours),   // Marcus — office leader
                ("user4", 65, workdayHours),   // Tom — consistent
                ("user5", 48, workdayHours),   // Priya — solid contributor
                ("user6", 30, workdayHours),   // Lucas — newer member
            });

            // Fitness — mornings and evenings
            AddCompletions(fitChores, fitness.Id, new[]
            {
                ("user5", 60, morningHours),   // Priya — morning workouts
                ("user6", 45, eveningHours),   // Lucas — evening sessions
                ("user7", 35, morningHours),   // Emily — regular
                ("user8", 20, eveningHours),   // Daniel — occasional
            });

            await context.ChoreCompletion.AddRangeAsync(completions);
            await context.SaveChangesAsync();

            // ── Notifications ─────────────────────────────────────────────────────
            var allCompletions = await context.ChoreCompletion
                .Include(c => c.Chore)
                .OrderByDescending(c => c.CompletedOn)
                .Take(40)
                .ToListAsync();

            var notifications = new List<Notification>();

            // Generate ChoreCompleted notifications for each group member when someone finishes a chore
            foreach (var comp in allCompletions.Take(30))
            {
                var groupMemberIds = memberships
                    .Where(m => m.GroupId == comp.GroupId && m.UserId != comp.UserId)
                    .Select(m => m.UserId)
                    .ToList();

                foreach (var recipientId in groupMemberIds)
                {
                    notifications.Add(new Notification
                    {
                        UserId      = recipientId,
                        Type        = NotificationType.ChoreCompleted,
                        Message     = $"A teammate completed \"{comp.Chore.Name}\"",
                        ChoreId     = comp.ChoreId,
                        GroupId     = comp.GroupId,
                        ActorUserId = comp.UserId,
                        IsRead      = rng.Next(0, 2) == 0,
                        CreatedAt   = comp.CompletedOn.AddMinutes(1)
                    });
                }
            }

            // Add a few overdue alerts for every user
            var overdueChores = allChores.Where(c => c.Status == ChoreStatus.Todo).Take(6).ToList();
            string[][] groupUserMap =
            {
                new[] { "user1","user2","user3","user4" },
                new[] { "user3","user5","user7","user8" },
                new[] { "user2","user4","user5","user6" },
                new[] { "user5","user6","user7","user8" },
            };
            foreach (var chore in overdueChores)
            {
                var idx = chore.GroupId == apartment.Id ? 0
                        : chore.GroupId == family.Id    ? 1
                        : chore.GroupId == office.Id    ? 2 : 3;
                foreach (var uid in groupUserMap[idx])
                {
                    notifications.Add(new Notification
                    {
                        UserId    = uid,
                        Type      = NotificationType.ChoreOverdue,
                        Message   = $"\"{chore.Name}\" is overdue — please complete it soon",
                        ChoreId   = chore.Id,
                        GroupId   = chore.GroupId,
                        IsRead    = false,
                        CreatedAt = now.AddHours(-rng.Next(1, 12))
                    });
                }
            }

            // Prune to avoid duplicate spam
            var trimmed = notifications
                .GroupBy(n => new { n.UserId, n.ChoreId, n.Type })
                .SelectMany(g => g.Take(1))
                .Take(200)
                .ToList();

            await context.Notifications.AddRangeAsync(trimmed);
            await context.SaveChangesAsync();
        }

        // ── Helpers ───────────────────────────────────────────────────────────────

        private static ApplicationUser MakeUser(string id, string username, string email, string first, string last) =>
            new ApplicationUser
            {
                Id                 = id,
                UserName           = username,
                Email              = email,
                FirstName          = first,
                LastName           = last,
                NormalizedUserName = username.ToUpper(),
                NormalizedEmail    = email.ToUpper(),
                ProfilePictureUrl  = "/default-avatar.jpeg",
                EmailConfirmed     = true,
            };

        private static GroupMember GM(int groupId, string userId, DateTime joinedAt) =>
            new GroupMember { GroupId = groupId, UserId = userId, JoinedAt = joinedAt };

        private static Chore C(string name, string desc, int groupId,
            RecurrenceType rec, int? intervalDays, ChoreDifficulty diff,
            ChoreStatus status, DateTime nextOccurrence) =>
            new Chore
            {
                Name              = name,
                Description       = desc,
                GroupId           = groupId,
                Recurrence        = rec,
                IntervalDays      = intervalDays,
                Difficulty        = diff,
                Status            = status,
                NextOccurence     = nextOccurrence,
                CreatedAt         = DateTime.UtcNow.AddDays(-80),
                UpdatedAt         = DateTime.UtcNow,
            };
    }
}
