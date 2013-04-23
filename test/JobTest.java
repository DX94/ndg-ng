import org.junit.*;
import play.test.*;
import play.mvc.*;
import play.mvc.Http.*;
import models.*;

public class JobTest extends FunctionalTest {

    @Test
    public void createAndRetrieveJob() {
        // Create a new job and save it
        new Jobs("2012-09-27", "2012-09-04", "admin", "a@a.com", false).save();

        // Retrieve the job on 2012-09-27
        Jobs one = Jobs.find("byDateTo", "2012-09-04").first();

        // Test
        assertNotNull(one);
    }
}
