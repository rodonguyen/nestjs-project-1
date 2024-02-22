import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import * as pactum from "pactum";
import { AuthDto } from "src/auth/dto";
import { EditUserDto } from "src/user/dto";

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
          .inspect();
      });
    });
  });

  describe("Bookmark", () => {
    describe("Create bookmark", () => {});
    describe("Create bookmark - invalid url", () => {});
    describe("Get bookmark", () => {});
    describe("Get bookmark - not found", () => {});
    describe("Update bookmark", () => {});
    describe("Update bookmark - not found", () => {});
    describe("Delete bookmark", () => {});
    describe("Delete bookmark - not found", () => {});
  });
});
