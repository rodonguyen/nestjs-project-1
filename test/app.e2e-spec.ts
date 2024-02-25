import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import * as pactum from "pactum";
import { AuthDto } from "src/auth/dto";
import { EditUserDto } from "src/user/dto";
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto";

describe("App E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication(); // emulate our app
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl("http://localhost:3333");
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("Auth", () => {
    const dto: AuthDto = {
      email: "new@gmail.com",
      password: "123",
    };
    describe("Signup", () => {
      it("should create a user", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody(dto)
          .expectStatus(201);
      });

      it("should throw error - empty email", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({ ...dto, email: "" })
          .expectStatus(400);
      });

      it("should throw error - empty password", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({ ...dto, password: "" })
          .expectStatus(400);
      });

      it("should throw error - empty body", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({ ...dto, password: "" })
          .expectStatus(400);
      });
    });

    describe("Signin", () => {
      it("should signin a user", () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody(dto)
          .expectStatus(200)
          .stores("userToken", "access_token");
      });
      it("should throw error - invalid password", () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({ ...dto, password: "invalid" })
          .expectStatus(403);
      });
    });
  });

  describe("User", () => {
    describe("Get me", () => {
      it("should return logged-in user data", () => {
        return pactum
          .spec()
          .get("/users/me")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .expectStatus(200);
      });
    });

    describe("Update user", () => {
      const dto: EditUserDto = {
        firstName: "satoshi",
        lastName: "nakamoto",
      };

      it("should edit user", () => {
        return pactum
          .spec()
          .patch("/users")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .withBody(dto)
          .expectStatus(200);
      });

      it("should not edit user - empty body", () => {
        return pactum
          .spec()
          .patch("/users")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .withBody({})
          .expectStatus(200)
          .expectBodyContains("email")
          .expectBodyContains("satos") // part of a string also works
          .expectBodyContains("satoshi");
      });
    });
  });

  describe("Bookmark", () => {
    const createBookmarkDto: CreateBookmarkDto = {
      title: "Googlee",
      link: "https://www.google.com",
      description: "not my fav search engine",
    };

    const editBookmarkDto: EditBookmarkDto = {
      title: "Yahoo",
      link: "https://www.yahoo.com",
      description: "dead place",
    };
    it("should get an array of bookmarks initially", () => {
      return pactum
        .spec()
        .get("/bookmarks")
        .withHeaders({
          Authorization: "Bearer $S{userToken}",
        })
        .expectStatus(200)
        .expectBody([]);
    });

    describe("Create bookmark", () => {
      it("should create a bookmark", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .withBody(createBookmarkDto)
          .expectStatus(201)
          .expectBodyContains("id")
          .stores("bookmarkIdCreated", "id");
      });
    });

    describe("Get a bookmark by id", () => {
      it("should get a bookmark", () => {
        return pactum
          .spec()
          .get("/bookmarks/$S{bookmarkIdCreated}")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .expectStatus(200)
          .expectBodyContains("id")
          .inspect();
      });
    });

    describe("Get bookmarks of logged-in user", () => {
      it("should get an array of bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .expectStatus(200)
          .expectJsonLength(1)
          .expectBodyContains("id")
          .expectBodyContains(createBookmarkDto.title);
      });
    });

    describe("Update bookmark", () => {
      it("should update a bookmark", () => {
        return pactum
          .spec()
          .patch("/bookmarks/$S{bookmarkIdCreated}")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          })
          .withBody(editBookmarkDto)
          .expectStatus(200)
          .expectBodyContains("id")
          .expectBodyContains(editBookmarkDto.title)
          .expectBodyContains(editBookmarkDto.description);
      });
    });

    describe("Delete bookmark", () => {
      it("should delete a bookmark", () => {
        return pactum
          .spec()
          .delete("/bookmarks/$S{bookmarkIdCreated}")
          .withHeaders({
            Authorization: "Bearer $S{userToken}",
          });
      });

      it("could not delete a bookmark - not found", () => {
        console.log("deleting unexisting bookmark...");
        return pactum.spec().delete("/bookmarks/99").withHeaders({
          Authorization: "Bearer $S{userToken}",
        });
      });

      it('should get empty bookmark array', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200)
          .expectJsonLength(0)
          .inspect();
      });
    });
  });
});
